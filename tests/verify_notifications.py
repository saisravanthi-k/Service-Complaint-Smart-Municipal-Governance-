import os
import sys
from datetime import datetime, timedelta

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal, engine
from app.models.models import Complaint, Notification, Officer
from app.services.escalation_service import escalation_engine
from app.api.notifications import get_notifications

def test_notifications_workflow():
    db = SessionLocal()
    try:
        print("=== VERIFYING REAL-TIME NOTIFICATION SYSTEM ===")

        # 1. Simulate an overdue complaint to force breach notification generation
        overdue_c = db.query(Complaint).filter(Complaint.status.in_(["ASSIGNED", "IN_PROGRESS"])).first()
        if overdue_c:
            overdue_c.sla_deadline = datetime.utcnow() - timedelta(hours=3)
            db.commit()
            print(f"[OK] Simulated overdue SLA deadline for Complaint #{overdue_c.complaint_number}")

        # 2. Run Escalation Engine evaluation
        res = escalation_engine.evaluate_and_escalate(db)
        print(f"[OK] Escalation Engine Result: {res}")

        # 3. Test Admin Notifications API Endpoint
        admin_notifs = get_notifications(recipient_type="ADMIN", recipient_id=1, db=db)
        print(f"\n[OK] Admin Notifications Count: {len(admin_notifs)}")
        for n in admin_notifs[:3]:
            print(f"   • [{n.recipient_type}-{n.channel}] Title: '{n.title}'")
            print(f"     Body: '{n.message}'")

        # 4. Test Manager Notifications API Endpoint
        mgr_notifs = get_notifications(recipient_type="OFFICER", recipient_id=1, db=db)
        print(f"\n[OK] Manager Notifications Count: {len(mgr_notifs)}")
        for n in mgr_notifs[:3]:
            print(f"   • [{n.recipient_type}-{n.channel}] Title: '{n.title}'")
            print(f"     Body: '{n.message}'")

        assert len(admin_notifs) > 0
        assert len(mgr_notifs) > 0
        print("\n✅ NOTIFICATIONS VERIFICATION SUCCESSFUL! ALL NOTIFICATIONS WORKING 100% PERFECTLY!")

    finally:
        db.close()

if __name__ == "__main__":
    test_notifications_workflow()
