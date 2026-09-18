import os
import sys
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Complaint, Officer, Department, ComplaintTimeline
from app.api.complaints import register_complaint, update_status
from app.schemas.schemas import ComplaintCreate, ComplaintUpdateStatus

def test_single_problem_allocation():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("=== VERIFYING SINGLE PROBLEM PER MANAGER ALLOCATION & QUEUE SYSTEM ===")

        # Clean up existing test complaints for test isolation
        db.query(Complaint).delete()
        db.commit()

        # Ensure Officers exist and reset active_workload to 0 for test
        officers = db.query(Officer).filter(Officer.status == "ACTIVE").all()
        for off in officers:
            off.active_workload = 0
        db.commit()

        # STEP 1: Register 1st complaint for Department 1 (Water Supply)
        print("\n1. Registering Complaint #1 for Dept 1...")
        c1_in = ComplaintCreate(
            title="Water Leakage 1",
            description="First water complaint",
            department_id=1,
            ward_id="WARD-01",
            priority="HIGH"
        )
        c1 = register_complaint(complaint_in=c1_in, citizen_id=1, db=db)
        print(f"   Complaint 1: #{c1.complaint_number} | Status: {c1.status} | Assigned Manager ID: {c1.assigned_officer_id}")

        officer1 = db.query(Officer).filter(Officer.id == c1.assigned_officer_id).first()
        print(f"   Manager '{officer1.full_name}' active workload: {officer1.active_workload}")
        assert c1.status == "ASSIGNED"
        assert officer1.active_workload == 1

        # Fill up all managers in Dept 1 if there are others
        dept1_offs = db.query(Officer).filter(Officer.department_id == 1, Officer.status == "ACTIVE").all()
        for off in dept1_offs:
            off.active_workload = 1
        db.commit()

        # Also set all other managers' active workload to 1 so ALL managers are busy
        all_offs = db.query(Officer).filter(Officer.status == "ACTIVE").all()
        for off in all_offs:
            off.active_workload = 1
        db.commit()

        # STEP 2: Register 2nd complaint when ALL managers are busy (active_workload == 1)
        print("\n2. Registering Complaint #2 when ALL managers are busy...")
        c2_in = ComplaintCreate(
            title="Water Pipe Burst 2 (Queue Test)",
            description="Second water complaint while manager is busy",
            department_id=1,
            ward_id="WARD-01",
            priority="CRITICAL"
        )
        c2 = register_complaint(complaint_in=c2_in, citizen_id=1, db=db)
        print(f"   Complaint 2: #{c2.complaint_number} | Status: {c2.status} | Assigned Manager ID: {c2.assigned_officer_id}")
        assert c2.status == "PENDING"
        assert c2.assigned_officer_id is None
        print("   [PASS] Complaint placed in PENDING Queue as expected!")

        # STEP 3: Resolve Complaint #1 to free Officer 1
        print(f"\n3. Manager '{officer1.full_name}' resolves Complaint #1...")
        officer1.active_workload = 1 # ensure officer 1 is the one resolving
        db.commit()

        status_update = ComplaintUpdateStatus(status="RESOLVED", resolution_notes="Pipe repaired completely.")
        c1_res = update_status(complaint_id=c1.id, status_in=status_update, db=db)
        print(f"   Complaint 1 Status updated to: {c1_res.status}")

        # Check if Complaint #2 was auto-assigned from queue!
        db.refresh(c2)
        print(f"   Post-Resolution Queue Check -> Complaint 2 Status: {c2.status} | Assigned Manager ID: {c2.assigned_officer_id}")
        assert c2.status == "ASSIGNED"
        assert c2.assigned_officer_id == officer1.id
        print("   [PASS] Complaint #2 auto-assigned from PENDING queue to free manager successfully!")

        print("\n=== ALL SINGLE PROBLEM ALLOCATION & QUEUE TESTS PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    test_single_problem_allocation()
