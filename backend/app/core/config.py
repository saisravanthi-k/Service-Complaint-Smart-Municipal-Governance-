import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Service Complaint - Smart Municipal Governance"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_municipal_complaint_portal_2026_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./service_complaint.db"
    )
    
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8501",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8501"
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

# Department & Urgency SLA Matrix (in hours)
DEPARTMENT_SLA_MATRIX = {
    "Electricity & Power Grid": {"CRITICAL": 2, "HIGH": 6, "MEDIUM": 12, "LOW": 24},
    "ELEC": {"CRITICAL": 2, "HIGH": 6, "MEDIUM": 12, "LOW": 24},
    
    "Water Supply & Sanitation": {"CRITICAL": 4, "HIGH": 12, "MEDIUM": 24, "LOW": 48},
    "WATER": {"CRITICAL": 4, "HIGH": 12, "MEDIUM": 24, "LOW": 48},
    
    "Public Health & Waste": {"CRITICAL": 6, "HIGH": 12, "MEDIUM": 24, "LOW": 48},
    "HEALTH": {"CRITICAL": 6, "HIGH": 12, "MEDIUM": 24, "LOW": 48},
    
    "Roads & Infrastructure": {"CRITICAL": 6, "HIGH": 24, "MEDIUM": 48, "LOW": 72},
    "ROADS": {"CRITICAL": 6, "HIGH": 24, "MEDIUM": 48, "LOW": 72},
    
    "Town Planning & Encroachment": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96},
    "PLAN": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96},
}

def get_sla_hours_for_department(dept_identifier: str, priority: str = "MEDIUM") -> int:
    priority_upper = priority.upper() if priority else "MEDIUM"
    dept_matrix = DEPARTMENT_SLA_MATRIX.get(dept_identifier)
    
    if not dept_matrix:
        # Check partial match
        for key in DEPARTMENT_SLA_MATRIX:
            if dept_identifier and key.lower() in dept_identifier.lower():
                dept_matrix = DEPARTMENT_SLA_MATRIX[key]
                break
                
    if dept_matrix:
        return dept_matrix.get(priority_upper, dept_matrix.get("MEDIUM", 24))
    
    # Global priority fallback if department not matched
    default_priority_map = {"CRITICAL": 6, "HIGH": 12, "MEDIUM": 24, "LOW": 48}
    return default_priority_map.get(priority_upper, 24)

