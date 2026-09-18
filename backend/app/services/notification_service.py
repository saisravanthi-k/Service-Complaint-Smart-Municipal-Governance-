import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Notification

logger = logging.getLogger("notification_service")

class NotificationService:
    """
    Multi-Channel Notification Dispatcher for Municipal Complaint Management.
    Supports:
    - IN_APP: Stored in DB Notification table for instant dashboard rendering.
    - EMAIL: Simulated email dispatch with structured logging.
    - SMS: Simulated SMS gateway dispatch.
    """
    def send_notification(
        self,
        db: Session,
        recipient_type: str,  # 'CITIZEN', 'OFFICER', 'ADMIN', 'COMMISSIONER'
        recipient_id: int,
        title: str,
        message: str,
        channel: str = "IN_APP"
    ) -> Notification:
        # Create In-App DB Record
        notif = Notification(
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            title=title,
            message=message,
            channel=channel,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Dispatch across other configured channels
        if channel in ["EMAIL", "ALL"]:
            self._send_email(recipient_type, recipient_id, title, message)
        
        if channel in ["SMS", "ALL"]:
            self._send_sms(recipient_type, recipient_id, message)

        return notif

    def dispatch_multi_channel(
        self,
        db: Session,
        recipient_type: str,
        recipient_id: int,
        title: str,
        message: str,
        channels: List[str] = ["IN_APP", "EMAIL", "SMS"]
    ):
        results = []
        for ch in channels:
            res = self.send_notification(
                db=db,
                recipient_type=recipient_type,
                recipient_id=recipient_id,
                title=title,
                message=message,
                channel=ch
            )
            results.append(res)
        return results

    def _send_email(self, recipient_type: str, recipient_id: int, title: str, message: str):
        logger.info(f"[EMAIL NOTIFICATION] To: {recipient_type} (ID: {recipient_id}) | Subject: {title} | Body: {message}")
        try:
            print(f"[EMAIL DISPATCH] [{recipient_type}-{recipient_id}] {title}\n    {message}")
        except Exception:
            pass

    def _send_sms(self, recipient_type: str, recipient_id: int, message: str):
        logger.info(f"[SMS NOTIFICATION] To: {recipient_type} (ID: {recipient_id}) | Text: {message}")
        try:
            print(f"[SMS DISPATCH] [{recipient_type}-{recipient_id}] {message}")
        except Exception:
            pass

notification_service = NotificationService()
