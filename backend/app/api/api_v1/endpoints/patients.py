from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import Patient, PatientStatus
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.api.deps import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new patient record"""
    # Check if medical record number already exists
    db_patient = db.query(Patient).filter(Patient.medical_record_number == patient_in.medical_record_number).first()
    if db_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this medical record number already exists"
        )
    
    # Create new patient
    db_patient = Patient(
        medical_record_number=patient_in.medical_record_number,
        full_name=patient_in.full_name,
        date_of_birth=patient_in.date_of_birth,
        admission_date=patient_in.admission_date or datetime.utcnow(),
        diagnosis=patient_in.diagnosis,
        notes=patient_in.notes,
        status=patient_in.status or PatientStatus.STABLE,
        room_number=patient_in.room_number,
        camera_id=patient_in.camera_id,
        sensitivity_level=patient_in.sensitivity_level or 1.0,
        doctor_id=patient_in.doctor_id or current_user.id
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/", response_model=List[PatientResponse])
def get_patients(
    skip: int = 0,
    limit: int = 100,
    status: Optional[PatientStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get list of patients with optional filtering"""
    query = db.query(Patient)
    
    # Filter by status if provided
    if status:
        query = query.filter(Patient.status == status)
        
    # Search by name or medical record number
    if search:
        query = query.filter(
            (Patient.full_name.ilike(f"%{search}%")) | 
            (Patient.medical_record_number.ilike(f"%{search}%"))
        )
    
    # If user is not admin, only show their patients
    if current_user.role != "admin":
        query = query.filter(Patient.doctor_id == current_user.id)
        
    patients = query.offset(skip).limit(limit).all()
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if user has access to this patient
    if current_user.role != "admin" and patient.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
        
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a patient record"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if user has access to this patient
    if current_user.role != "admin" and patient.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this patient"
        )
    
    # Update patient data
    update_data = patient_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient