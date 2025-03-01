from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime

Base = declarative_base()

class PatientStatus(str, enum.Enum):
    CRITICAL = "critical"
    STABLE = "stable"
    RECOVERING = "recovering"

class MovementSeverity(str, enum.Enum):
    NORMAL = "normal"
    ATTENTION = "attention"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # doctor, nurse, admin
    is_active = Column(Boolean, default=True)
    
    patients = relationship("Patient", back_populates="doctor")
    alerts = relationship("Alert", back_populates="recipient")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    medical_record_number = Column(String, unique=True, index=True)
    full_name = Column(String, index=True)
    date_of_birth = Column(DateTime)
    admission_date = Column(DateTime, default=datetime.utcnow)
    diagnosis = Column(Text)
    notes = Column(Text)
    status = Column(Enum(PatientStatus), default=PatientStatus.STABLE)
    room_number = Column(String)
    camera_id = Column(String)
    sensitivity_level = Column(Float, default=1.0)  # Movement sensitivity multiplier
    
    doctor_id = Column(Integer, ForeignKey("users.id"))
    doctor = relationship("User", back_populates="patients")
    
    movements = relationship("Movement", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")

class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    movement_type = Column(String)  # e.g., arm_movement, leg_movement, head_movement
    duration_seconds = Column(Float)
    intensity = Column(Float)  # Calculated intensity of movement
    body_part = Column(String)  # Specific body part that moved
    severity = Column(Enum(MovementSeverity), default=MovementSeverity.NORMAL)
    
    patient = relationship("Patient", back_populates="movements")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    movement_id = Column(Integer, ForeignKey("movements.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    message = Column(Text)
    severity = Column(Enum(MovementSeverity))
    acknowledged = Column(Boolean, default=False)
    acknowledged_timestamp = Column(DateTime, nullable=True)
    
    patient = relationship("Patient", back_populates="alerts")
    recipient = relationship("User", back_populates="alerts")