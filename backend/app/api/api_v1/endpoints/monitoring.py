from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from app.db.session import get_db
from app.db.models import Patient, Movement, Alert, MovementSeverity
from app.motion_detection.detector import MotionDetector
from app.schemas.movement import MovementCreate
from app.services.alert_service import AlertService

router = APIRouter()

# Store active connections
connections = {}
# Store motion detectors for each patient
motion_detectors = {}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.websocket("/ws/{patient_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    patient_id: int,
    db: Session = Depends(get_db)
):
    # Get patient data
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        await websocket.close(code=1000, reason="Patient not found")
        return
    
    # Accept the connection
    await websocket.accept()
    
    # Create connection ID
    connection_id = f"{patient_id}_{datetime.utcnow().timestamp()}"
    connections[connection_id] = websocket
    
    # Initialize motion detector with patient's sensitivity level
    if patient_id not in motion_detectors:
        motion_detectors[patient_id] = MotionDetector(sensitivity=patient.sensitivity_level)
    
    # Alert service for sending notifications
    alert_service = AlertService(db)
    
    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_bytes()
            
            # Process frame with motion detector
            import numpy as np
            import cv2
            
            # Convert bytes to numpy array
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Detect motion
            motion_detected, movements, processed_frame = motion_detectors[patient_id].detect_motion(frame)
            
            # If motion detected, store in database and check for alerts
            if motion_detected and movements:
                for movement_data in movements:
                    # Analyze movement severity
                    severity = motion_detectors[patient_id].analyze_movement_severity(
                        movement_data, 
                        patient.status
                    )
                    
                    # Create movement record
                    db_movement = Movement(
                        patient_id=patient_id,
                        movement_type="detected",
                        duration_seconds=movement_data["duration"],
                        intensity=movement_data["intensity"],
                        body_part=movement_data["body_part"],
                        severity=severity
                    )
                    
                    db.add(db_movement)
                    db.commit()
                    db.refresh(db_movement)
                    
                    # Check if alert should be created
                    if severity in [MovementSeverity.ATTENTION, MovementSeverity.CRITICAL]:
                        await alert_service.create_movement_alert(
                            patient_id=patient_id,
                            movement_id=db_movement.id,
                            severity=severity,
                            message=f"{severity.value.title()} movement detected: {movement_data['body_part']} moved for {movement_data['duration']:.1f} seconds with intensity {movement_data['intensity']:.1f}%"
                        )
            
            # Encode processed frame to send back to client
            _, buffer = cv2.imencode('.jpg', processed_frame)
            processed_data = buffer.tobytes()
            
            # Send processed frame and movement data back to client
            await websocket.send_bytes(processed_data)
            await websocket.send_json({
                "motion_detected": motion_detected,
                "movements": [
                    {
                        "body_part": m["body_part"],
                        "duration": m["duration"],
                        "intensity": m["intensity"],
                        "severity": motion_detectors[patient_id].analyze_movement_severity(m, patient.status)
                    } for m in movements
                ]
            })
            
    except WebSocketDisconnect:
        # Remove connection
        if connection_id in connections:
            del connections[connection_id]
        logger.info(f"Client disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket: {e}")
        if connection_id in connections:
            del connections[connection_id]