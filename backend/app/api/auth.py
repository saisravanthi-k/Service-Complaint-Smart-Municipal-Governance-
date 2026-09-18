from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import Citizen, Officer
from app.schemas.schemas import UserRegister, UserLogin, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register_citizen(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(Citizen).filter(Citizen.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    pwd_hash = get_password_hash(user_in.password)
    citizen = Citizen(
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=pwd_hash,
        address=user_in.address,
        ward_id=user_in.ward_id or "WARD-01"
    )
    db.add(citizen)
    db.commit()
    db.refresh(citizen)

    token = create_access_token(data={"sub": citizen.email, "user_type": "citizen", "id": citizen.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_type": "citizen",
        "user_id": citizen.id,
        "full_name": citizen.full_name,
        "email": citizen.email,
        "ward_id": citizen.ward_id
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Try Citizen login
    citizen = db.query(Citizen).filter(Citizen.email == credentials.email).first()
    if citizen and verify_password(credentials.password, citizen.password_hash):
        token = create_access_token(data={"sub": citizen.email, "user_type": "citizen", "id": citizen.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": "citizen",
            "user_id": citizen.id,
            "full_name": citizen.full_name,
            "email": citizen.email,
            "ward_id": citizen.ward_id
        }

    # 2. Try Officer/Manager/Admin/Commissioner login
    officer = db.query(Officer).filter(Officer.email == credentials.email).first()
    if officer and verify_password(credentials.password, officer.password_hash):
        user_type = "officer"
        if "admin" in officer.email.lower():
            user_type = "admin"
        elif "commissioner" in officer.email.lower():
            user_type = "commissioner"

        token = create_access_token(data={"sub": officer.email, "user_type": user_type, "id": officer.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": user_type,
            "user_id": officer.id,
            "full_name": officer.full_name,
            "email": officer.email,
            "department_id": officer.department_id,
            "ward_id": officer.ward_id
        }

    # Manager Map for Demo Fallback
    manager_fallback_map = {
        "abhi.manager@gvmc.gov.in": ("Abhi", 1, 1),
        "teja.manager@gvmc.gov.in": ("Teja", 2, 2),
        "janu.manager@gvmc.gov.in": ("Janu", 3, 3),
        "ravi.manager@gvmc.gov.in": ("Ravi", 4, 4),
        "officer.water@telangana.gov.in": ("K. Suresh Rao", 5, 1)
    }

    if credentials.email in manager_fallback_map:
        name, m_id, d_id = manager_fallback_map[credentials.email]
        token = create_access_token(data={"sub": credentials.email, "user_type": "officer", "id": m_id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": "officer",
            "user_id": m_id,
            "full_name": name,
            "email": credentials.email,
            "department_id": d_id,
            "ward_id": f"WARD-0{m_id}"
        }

    # Demo fallback login for instant accessibility
    if credentials.email in ["citizen@telangana.gov.in", "admin@telangana.gov.in", "commissioner@telangana.gov.in"]:
        u_type = "citizen" if "citizen" in credentials.email else ("commissioner" if "commissioner" in credentials.email else "admin")
        token = create_access_token(data={"sub": credentials.email, "user_type": u_type, "id": 1})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": u_type,
            "user_id": 1,
            "full_name": "Demo Authorized User",
            "email": credentials.email,
            "ward_id": "WARD-01"
        }

    raise HTTPException(status_code=401, detail="Invalid email or password")
