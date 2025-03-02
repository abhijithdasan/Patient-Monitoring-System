from fastapi import APIRouter
from app.api.api_v1.endpoints import monitoring, patients

api_router = APIRouter()
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
