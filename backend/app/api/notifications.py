from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Notification
from app.services.escalation_service import escalation_engine

router = APIRouter(prefix="/notifications", tags=["Notifications & Escalation"])

@router.get("/")
def get_notifications(recipient_type: str = "CITIZEN", recipient_id: int = 1, db: Session = Depends(get_db)):
    # 1. Automatically run SLA evaluation engine so overdue tickets trigger breach notifications instantly!
    try:
        escalation_engine.evaluate_and_escalate(db)
    except Exception as e:
        print(f"Auto escalation evaluation notice: {e}")

    rec_type_upper = recipient_type.upper()
    query = db.query(Notification)

    if rec_type_upper in ["ADMIN", "COMMISSIONER"]:
        query = query.filter(Notification.recipient_type.in_(["ADMIN", "COMMISSIONER"]))
    elif rec_type_upper in ["OFFICER", "MANAGER"]:
        query = query.filter(
            Notification.recipient_type.in_(["OFFICER", "MANAGER"]),
            (Notification.recipient_id == recipient_id) | (Notification.recipient_id == 1)
        )
    else:
        query = query.filter(
            Notification.recipient_type == "CITIZEN",
            (Notification.recipient_id == recipient_id) | (Notification.recipient_id == 1)
        )

    return query.order_by(Notification.created_at.desc()).limit(30).all()

@router.post("/trigger-escalation-check")
def trigger_escalation(db: Session = Depends(get_db)):
    res = escalation_engine.evaluate_and_escalate(db)
    return res
