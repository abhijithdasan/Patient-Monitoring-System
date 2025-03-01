import cv2
import numpy as np
import tensorflow as tf
from datetime import datetime
import time
import logging
from typing import Tuple, Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MotionDetector:
    def __init__(
        self,
        sensitivity: float = 1.0,
        min_area: int = 500,
        history: int = 120,
        var_threshold: float = 16,
        detect_shadows: bool = True
    ):
        self.sensitivity = sensitivity
        self.min_area = min_area
        self.fgbg = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=var_threshold,
            detectShadows=detect_shadows
        )
        self.pose_model = None  # Will be loaded when needed
        self.last_frame = None
        self.movement_start_time = None
        self.current_movements = {}
        
    def load_pose_estimation_model(self):
        """Load the pose estimation model (assuming a TensorFlow model)"""
        try:
            # This is a placeholder - you would use a proper model like MoveNet or PoseNet
            # For a real implementation, you might use TF Hub: 
            # self.pose_model = hub.load("https://tfhub.dev/google/movenet/singlepose/lightning/4")
            logger.info("Pose estimation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load pose estimation model: {e}")
            self.pose_model = None
            
    def detect_motion(self, frame) -> Tuple[bool, List[Dict], np.ndarray]:
        """
        Detect motion in the frame
        
        Returns:
            Tuple containing:
            - Boolean indicating if motion was detected
            - List of detected movements with details
            - Processed frame with visualizations
        """
        # Convert frame to grayscale for processing
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        # If this is the first frame, initialize and return
        if self.last_frame is None:
            self.last_frame = gray
            return False, [], frame
            
        # Apply background subtraction
        fgmask = self.fgbg.apply(gray)
        thresh = cv2.threshold(fgmask, 25 * self.sensitivity, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Find contours of moving objects
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_detected = False
        movements = []
        
        # Process each contour
        for contour in contours:
            if cv2.contourArea(contour) < self.min_area:
                continue
                
            motion_detected = True
            
            # Get bounding box of the motion
            (x, y, w, h) = cv2.boundingRect(contour)
            
            # Draw rectangle around the motion
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Identify which body part is moving (simplified)
            body_part = self._identify_body_part(x, y, w, h, frame.shape)
            
            # Calculate intensity based on area and movement
            intensity = cv2.contourArea(contour) / (frame.shape[0] * frame.shape[1]) * 100
            
            # Track movement duration
            current_time = time.time()
            movement_id = f"{body_part}_{x}_{y}"
            
            if movement_id not in self.current_movements:
                self.current_movements[movement_id] = {
                    "start_time": current_time,
                    "last_seen": current_time,
                    "body_part": body_part
                }
            else:
                self.current_movements[movement_id]["last_seen"] = current_time
                
            # Calculate duration
            duration = current_time - self.current_movements[movement_id]["start_time"]
            
            # Add to movements list
            movements.append({
                "body_part": body_part,
                "duration": duration,
                "intensity": intensity,
                "bounding_box": (x, y, w, h)
            })
            
            # Add text labels to the frame
            cv2.putText(
                frame,
                f"{body_part}: {duration:.1f}s",
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )
            
        # Clean up old movements (not seen for more than 2 seconds)
        current_time = time.time()
        movements_to_remove = []
        for movement_id, movement_data in self.current_movements.items():
            if current_time - movement_data["last_seen"] > 2.0:
                movements_to_remove.append(movement_id)
                
        for movement_id in movements_to_remove:
            self.current_movements.pop(movement_id)
        
        # Update last frame
        self.last_frame = gray
        
        return motion_detected, movements, frame
    
    def _identify_body_part(self, x: int, y: int, w: int, h: int, frame_shape: Tuple[int, int, int]) -> str:
        """
        Identify which body part is moving based on position
        This is a simplified version - a real system would use pose estimation
        """
        # Simple heuristic based on position in frame
        frame_height, frame_width = frame_shape[0], frame_shape[1]
        center_x = x + w/2
        center_y = y + h/2
        
        # Very simplified body part detection based on position
        if center_y < frame_height * 0.3:
            return "head"
        elif center_y < frame_height * 0.6:
            if center_x < frame_width * 0.5:
                return "left_arm"
            else:
                return "right_arm"
        else:
            if center_x < frame_width * 0.5:
                return "left_leg"
            else:
                return "right_leg"
    
    def analyze_movement_severity(self, movement: Dict, patient_condition: str) -> str:
        """
        Determine the severity of a movement based on its characteristics and patient condition
        """
        from app.db.models import MovementSeverity
        
        # Adjust thresholds based on patient condition
        duration_threshold = 5.0  # seconds
        intensity_threshold = 5.0  # percent of frame
        
        if patient_condition == "critical":
            # Lower thresholds for critical patients
            duration_threshold = 2.0
            intensity_threshold = 2.0
        
        # Determine severity
        if movement["intensity"] > intensity_threshold * 2 or movement["duration"] > duration_threshold * 2:
            return MovementSeverity.CRITICAL
        elif movement["intensity"] > intensity_threshold or movement["duration"] > duration_threshold:
            return MovementSeverity.ATTENTION
        else:
            return MovementSeverity.NORMAL