from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.models import Complaint, Officer, DelayReasonSubmission, ComplaintTimeline, SLARecord
from app.schemas.schemas import AdminDelayReview
from app.services.notification_service import notification_service

router = APIRouter(prefix="/admin", tags=["Admin SLA & Accountability Console"])

@router.get("/delay-submissions")
def get_delay_submissions(db: Session = Depends(get_db)):
    subs = db.query(DelayReasonSubmission).order_by(DelayReasonSubmission.submitted_at.desc()).all()
    res = []
    for s in subs:
        c = db.query(Complaint).filter(Complaint.id == s.complaint_id).first()
        off = db.query(Officer).filter(Officer.id == s.officer_id).first()
        res.append({
            "id": s.id,
            "complaint_id": s.complaint_id,
            "complaint_number": c.complaint_number if c else f"CMP-{s.complaint_id}",
            "complaint_title": c.title if c else "Complaint",
            "priority": c.priority if c else "MEDIUM",
            "officer_id": s.officer_id,
            "officer_name": off.full_name if off else "Manager",
            "reason_category": s.reason_category,
            "expected_completion_time": s.expected_completion_time,
            "additional_remarks": s.additional_remarks,
            "admin_status": s.admin_status,
            "admin_action_notes": s.admin_action_notes,
            "submitted_at": s.submitted_at,
            "reviewed_at": s.reviewed_at
        })
    return res

@router.post("/complaints/{complaint_id}/review-delay")
def review_delay_submission(
    complaint_id: int,
    review_in: AdminDelayReview,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    delay_sub = db.query(DelayReasonSubmission).filter(
        DelayReasonSubmission.complaint_id == complaint_id
    ).order_by(DelayReasonSubmission.submitted_at.desc()).first()

    now = datetime.utcnow()
    action = review_in.action.upper()
    mgr = db.query(Officer).filter(Officer.id == complaint.assigned_officer_id).first()
    mgr_name = mgr.full_name if mgr else "Manager"

    if delay_sub:
        delay_sub.admin_status = action
        delay_sub.admin_action_notes = review_in.action_notes
        delay_sub.reviewed_at = now

    if action == "ACCEPT":
        if delay_sub:
            delay_sub.admin_status = "ACCEPTED"
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Delay Reason Accepted",
            description=f"Admin accepted delay explanation ('{delay_sub.reason_category if delay_sub else 'General'}') submitted by Manager {mgr_name}. Notes: '{review_in.action_notes or 'Accepted'}'",
            actor_type="ADMIN",
            actor_name="Municipal Admin Console"
        ))
        notification_service.send_notification(
            db=db,
            recipient_type="OFFICER",
            recipient_id=complaint.assigned_officer_id or 1,
            title=f"Delay Reason Accepted for Ticket #{complaint.complaint_number}",
            message=f"Admin accepted your delay explanation for ticket #{complaint.complaint_number}. Please proceed with completion."
        )

    elif action == "REJECT":
        if delay_sub:
            delay_sub.admin_status = "REJECTED"
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Delay Reason Rejected",
            description=f"Admin rejected delay explanation submitted by Manager {mgr_name}. Notes: '{review_in.action_notes or 'Rejected'}'",
            actor_type="ADMIN",
            actor_name="Municipal Admin Console"
        ))
        notification_service.dispatch_multi_channel(
            db=db,
            recipient_type="OFFICER",
            recipient_id=complaint.assigned_officer_id or 1,
            title=f"URGENT: Delay Reason REJECTED for #{complaint.complaint_number}",
            message=f"Admin rejected your delay explanation for ticket #{complaint.complaint_number}. You are instructed to resolve this ticket immediately.",
            channels=["IN_APP", "EMAIL", "SMS"]
        )

    elif action == "EXTEND":
        if not review_in.extended_deadline:
            raise HTTPException(status_code=400, detail="extended_deadline is required for EXTEND action")
        
        old_deadline = complaint.sla_deadline
        complaint.sla_deadline = review_in.extended_deadline
        complaint.status = "IN_PROGRESS"
        if delay_sub:
            delay_sub.admin_status = "EXTENDED"

        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Deadline Extended",
            description=f"SLA Deadline extended from {old_deadline.strftime('%Y-%m-%d %H:%M')} to {review_in.extended_deadline.strftime('%Y-%m-%d %H:%M')} by Admin.",
            actor_type="ADMIN",
            actor_name="Municipal Admin Console"
        ))

        notification_service.dispatch_multi_channel(
            db=db,
            recipient_type="OFFICER",
            recipient_id=complaint.assigned_officer_id or 1,
            title=f"SLA Deadline Extended for Ticket #{complaint.complaint_number}",
            message=f"SLA deadline for ticket #{complaint.complaint_number} has been extended to {review_in.extended_deadline.strftime('%Y-%m-%d %H:%M UTC')}.",
            channels=["IN_APP", "EMAIL"]
        )

    elif action == "REASSIGN":
        if not review_in.new_officer_id:
            raise HTTPException(status_code=400, detail="new_officer_id is required for REASSIGN action")

        new_off = db.query(Officer).filter(Officer.id == review_in.new_officer_id).first()
        if not new_off:
            raise HTTPException(status_code=404, detail="New manager/officer not found")

        if new_off.active_workload >= 1 and complaint.assigned_officer_id != new_off.id:
            raise HTTPException(
                status_code=400,
                detail=f"Target manager {new_off.full_name} is currently handling another active problem."
            )

        prev_off_name = mgr_name
        if mgr and mgr.active_workload > 0:
            mgr.active_workload -= 1

        complaint.assigned_officer_id = new_off.id
        new_off.active_workload = 1
        complaint.status = "ASSIGNED"
        if delay_sub:
            delay_sub.admin_status = "REASSIGNED"

        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Complaint Reassigned",
            description=f"Complaint reassigned from Manager {prev_off_name} to Manager {new_off.full_name} by Admin.",
            actor_type="ADMIN",
            actor_name="Municipal Admin Console"
        ))

        notification_service.dispatch_multi_channel(
            db=db,
            recipient_type="OFFICER",
            recipient_id=new_off.id,
            title=f"NEW TICKET REASSIGNED: Ticket #{complaint.complaint_number}",
            message=f"Ticket #{complaint.complaint_number} has been reassigned to you by Admin. Please begin work immediately.",
            channels=["IN_APP", "EMAIL", "SMS"]
        )

    elif action == "ESCALATE":
        complaint.status = "ESCALATED"
        if delay_sub:
            delay_sub.admin_status = "ESCALATED"

        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Escalated to Higher Authorities",
            description=f"Complaint formally escalated to Commissioner & Higher Municipal Authorities by Admin.",
            actor_type="ADMIN",
            actor_name="Municipal Admin Console"
        ))

        notification_service.dispatch_multi_channel(
            db=db,
            recipient_type="COMMISSIONER",
            recipient_id=1,
            title=f"ADMIN ESCALATION: Ticket #{complaint.complaint_number}",
            message=f"Admin escalated ticket #{complaint.complaint_number} ({complaint.title}) for Commissioner review due to severe delay.",
            channels=["IN_APP", "EMAIL", "SMS"]
        )

    db.commit()
    db.refresh(complaint)
    return {"message": f"Successfully performed action '{action}' on complaint #{complaint.complaint_number}", "status": complaint.status}
