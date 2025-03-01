from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional

from app.db.models import Alert, Patient, Movement, User, MovementSeverity

class AlertService:
    def __init__(self, db: Session):
        self.db = db
        # Store WebSocket connections for alert notifications
        self.alert_connections = {}
        
    async def create_movement_alert(
        self,
        patient_id: int,
        movement_id: int,
        severity: MovementSeverity,
        message: str
    ):
        """Create an alert for a detected movement"""
        # Get patient data to determine who should receive alerts
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return
            
        # Get all staff assigned to this patient
        # In a real system, you would have a more complex assignment system
        assigned_staff = [patient.doctor_id]
        
        # Get nurses assigned to the patient's room/ward
        nurses = self.db.query(User).filter(User.role == "nurse").all()
        for nurse in nurses:
            assigned_staff.append(nurse.id)
            
        # Create alerts for each staff member
        for staff_id in assigned_staff:
            alert = Alert(
                patient_id=patient_id,
                recipient_id=staff_id,
                movement_id=movement_id,
                message=message,
                severity=severity
            )
            
            self.db.add(alert)
            
        self.db.commit()
        
        # Send notifications via WebSockets
        await self.send_alert_notifications(patient_id, severity, message)
        
        # If critical, trigger alarm system
        if severity == MovementSeverity.CRITICAL:
            await self.trigger_alarm(patient_id, message)
            
    async def send_alert_notifications(self, patient_id: int, severity: MovementSeverity, message: str):
        """Send alert notifications to connected staff via WebSockets"""
        # In a real system, you would have a proper pub/sub system here
        notification = {
            "type": "alert",
            "patient_id": patient_id,
            "severity": severity.value,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected staff WebSockets
        for connection_id, websocket in self.alert_connections.items():
            try:
                await websocket.send_json(notification)
            except Exception:
                # Remove disconnected WebSockets
                if connection_id in self.alert_connections:
                    del self.alert_connections[connection_id]
                    
    async def trigger_alarm(self, patient_id: int, message: str):
        """Trigger the physical alarm system for critical alerts"""
        # In a real system, this would connect to a physical alarm system
        # Here we just log it
        print(f"🚨 ALARM TRIGGERED for Patient #{patient_id}: {message}")
        
        # Get patient room for localized alarm
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if patient and patient.room_number:
            print(f"Alarm location: Room {patient.room_number}")
            
    async def register_alert_connection(self, user_id: int, websocket: WebSocket):
        """Register a staff WebSocket connection for alert notifications"""
        connection_id = f"alert_{user_id}_{datetime.utcnow().timestamp()}"
        self.alert_connections[connection_id] = websocket
        return connection_id
        
    def acknowledge_alert(self, alert_id: int, user_id: int) -> bool:
        """Acknowledge an alert"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return False
            
        # Check if user is authorized to acknowledge this alert
        if alert.recipient_id != user_id:
            # Check if user is admin or supervisor
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.role not in ["admin", "supervisor"]:
                return False
                
        # Mark as acknowledged
        alert.acknowledged = True
        alert.acknowledged_timestamp = datetime.utcnow()
        
        self.db.commit()
        return True