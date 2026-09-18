import os
import sys
from datetime import datetime, timedelta

# Set stdout encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Complaint, SLARecord, Officer, Department, Citizen, ComplaintTimeline, DelayReasonSubmission
from app.services.escalation_service import escalation_engine
from app.api.complaints import register_complaint, submit_delay_reason
from app.api.admin import review_delay_submission
from app.api.dashboard import get_sla_analytics
from app.api.officers import get_manager_performance_reports
from app.schemas.schemas import ComplaintCreate, DelayReasonCreate, AdminDelayReview

def test_sla_escalation_workflow():
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Reset officers workload to 0 for single-problem capacity test setup
    offs = db.query(Officer).all()
    for o in offs:
        o.active_workload = 0
    db.commit()

    try:
        print("--- TEST 1: Registering new complaint & starting SLA timer ---")
        c_in = ComplaintCreate(
            title="Pipeline Water Leakage at Ward 1",
            description="Major underground pipeline burst causing severe flooding on main road.",
            department_id=1,
            ward_id="WARD-01",
            priority="CRITICAL"
        )
        c_obj = register_complaint(complaint_in=c_in, citizen_id=1, db=db)
        print(f"[OK] Complaint registered: #{c_obj.complaint_number} (ID: {c_obj.id}, Status: {c_obj.status})")

        # Check Timeline events for Complaint Created, Assigned to Manager, SLA Started
        timeline_events = db.query(ComplaintTimeline).filter(ComplaintTimeline.complaint_id == c_obj.id).all()
        print(f"[OK] Timeline events count: {len(timeline_events)}")
        for te in timeline_events:
            print(f"   * [{te.event_type}] {te.description}")

        assert any(e.event_type == "Complaint Created" for e in timeline_events)
        assert any(e.event_type == "Assigned to Manager" for e in timeline_events)
        assert any(e.event_type == "SLA Started" for e in timeline_events)

        print("\n--- TEST 2: Simulating Overdue SLA & Running Escalation Engine ---")
        # Force deadline into past (overdue)
        c_obj.sla_deadline = datetime.utcnow() - timedelta(hours=2)
        db.commit()

        esc_res = escalation_engine.evaluate_and_escalate(db=db)
        print(f"[OK] Escalation engine result: {esc_res}")

        db.refresh(c_obj)
        print(f"[OK] Post-Escalation Complaint Status: {c_obj.status}")
        assert c_obj.status in ["SLA Violated", "SLA_VIOLATED"]

        print("\n--- TEST 3: Manager Delay Reason Submission ---")
        delay_in = DelayReasonCreate(
            reason_category="Water supply pipeline materials unavailable.",
            expected_completion_time=datetime.utcnow() + timedelta(hours=24),
            additional_remarks="Awaiting special 12-inch cast iron pipe delivery from warehouse."
        )
        delay_res = submit_delay_reason(complaint_id=c_obj.id, delay_in=delay_in, officer_id=1, db=db)
        print(f"[OK] Delay Reason Submitted: ID {delay_res.id}, Category: '{delay_res.reason_category}'")

        # Check Timeline for Delay Reason Submitted
        timeline_events_2 = db.query(ComplaintTimeline).filter(ComplaintTimeline.complaint_id == c_obj.id).all()
        assert any(e.event_type == "Delay Reason Submitted" for e in timeline_events_2)
        print(f"[OK] Delay Reason Submitted timeline event verified.")

        print("\n--- TEST 4: Admin Delay Review Action (EXTEND) ---")
        rev_in = AdminDelayReview(
            action="EXTEND",
            action_notes="Extension granted for 24 hours until pipeline materials arrive.",
            extended_deadline=datetime.utcnow() + timedelta(hours=24)
        )
        rev_res = review_delay_submission(complaint_id=c_obj.id, review_in=rev_in, db=db)
        print(f"[OK] Admin Review Action result: {rev_res}")

        db.refresh(c_obj)
        print(f"[OK] Updated Complaint Status post-extension: {c_obj.status}, Deadline: {c_obj.sla_deadline}")
        assert c_obj.status == "IN_PROGRESS"

        print("\n--- TEST 5: Checking SLA Analytics & Manager Performance Reports ---")
        sla_analytics = get_sla_analytics(db=db)
        print(f"[OK] SLA Dashboard Analytics:")
        print(f"   * Total SLA Violations: {sla_analytics['total_sla_violations']}")
        print(f"   * Delayed Complaints: {sla_analytics['number_of_delayed_complaints']}")
        print(f"   * Complaints Reassigned: {sla_analytics['complaints_reassigned']}")
        print(f"   * Avg Resolution Time: {sla_analytics['average_resolution_time_hours']}h")

        perf_reports = get_manager_performance_reports(db=db)
        print(f"[OK] Manager Performance Reports count: {len(perf_reports)}")
        for pr in perf_reports:
            print(f"   * Manager: {pr.officer_name} | Assigned: {pr.total_assigned} | Violations: {pr.sla_violations_count} | Rate: {pr.on_time_resolution_rate}%")

        print("\nALL SLA ESCALATION & MANAGER ACCOUNTABILITY TESTS PASSED!")

    finally:
        db.close()

if __name__ == "__main__":
    test_sla_escalation_workflow()
