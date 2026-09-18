from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from typing import List, Optional
from app.core.config import settings, get_sla_hours_for_department
from app.core.database import get_db
from app.models.models import Complaint, SLARecord, Feedback, Officer, Department, ComplaintTimeline, DelayReasonSubmission
from app.schemas.schemas import (
    ComplaintCreate, ComplaintOut, ComplaintUpdateStatus, FeedbackCreate,
    DelayReasonCreate, DelayReasonOut, ComplaintTimelineOut
)
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("/", response_model=ComplaintOut)
def register_complaint(
    complaint_in: ComplaintCreate,
    citizen_id: int = 1, # Default or extracted from JWT
    db: Session = Depends(get_db)
):
    ticket_num = f"GVMC-{uuid.uuid4().hex[:4].upper()}" if not hasattr(complaint_in, 'complaint_number') else f"GVMC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    
    dept_name = "Water Supply & Sanitation"
    if complaint_in.department_id:
        dept = db.query(Department).filter(Department.id == complaint_in.department_id).first()
        if dept:
            dept_name = dept.name

    initial_priority = getattr(complaint_in, "priority", "MEDIUM") or "MEDIUM"

    sla_risk = ai_service.predict_sla_risk(
        department_id=complaint_in.department_id or 1,
        ward_id=complaint_in.ward_id or "WARD-01",
        priority=initial_priority,
        sla_hours=24,
        officer_workload=5
    )

    priority = initial_priority if initial_priority in ["CRITICAL", "HIGH", "EMERGENCY"] else ("HIGH" if sla_risk["is_high_risk"] else "MEDIUM")
    priority_score = sla_risk["breach_risk_score"]

    sla_hours = get_sla_hours_for_department(dept_name, priority)
    now = datetime.utcnow()
    deadline = now + timedelta(hours=sla_hours)

    # 1. 5-Ward Designated Manager Allocation Algorithm
    # Prioritize assigning the complaint directly to the Manager assigned to the selected Ward
    assigned_off = None
    if complaint_in.ward_id:
        assigned_off = db.query(Officer).filter(
            Officer.ward_id == complaint_in.ward_id,
            Officer.status == "ACTIVE",
            Officer.active_workload == 0
        ).first()

    # Fallback 1: Match active manager by Department ID with 0 workload
    if not assigned_off and complaint_in.department_id:
        assigned_off = db.query(Officer).filter(
            Officer.department_id == complaint_in.department_id,
            Officer.status == "ACTIVE",
            Officer.active_workload == 0
        ).first()

    # Fallback 2: Any active manager with 0 workload
    if not assigned_off:
        assigned_off = db.query(Officer).filter(
            Officer.status == "ACTIVE",
            Officer.active_workload == 0
        ).first()

    if assigned_off:
        assigned_officer_id = assigned_off.id
        manager_name = assigned_off.full_name
        assigned_off.active_workload += 1
        initial_status = "ASSIGNED"
    else:
        assigned_officer_id = None
        manager_name = "Unassigned Desk"
        initial_status = "PENDING"

    complaint = Complaint(
        complaint_number=ticket_num,
        citizen_id=citizen_id,
        department_id=complaint_in.department_id,
        service_id=complaint_in.service_id,
        ward_id=complaint_in.ward_id,
        title=complaint_in.title,
        description=complaint_in.description,
        speech_audio_url=complaint_in.speech_audio_url,
        image_url=complaint_in.image_url,
        language=complaint_in.language or "Telugu",
        status=initial_status,
        priority=priority,
        priority_score=priority_score,
        sla_deadline=deadline,
        sla_started_at=now,
        assigned_officer_id=assigned_officer_id,
        latitude=complaint_in.latitude,
        longitude=complaint_in.longitude,
        address=complaint_in.address
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 1. Timeline Event: Complaint Created
    db.add(ComplaintTimeline(
        complaint_id=complaint.id,
        event_type="Complaint Created",
        description=f"Complaint #{complaint.complaint_number} logged successfully by Citizen.",
        actor_type="CITIZEN",
        actor_name="Citizen Portal"
    ))

    if assigned_officer_id:
        # 2. Timeline Event: Assigned to Manager
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Assigned to Manager",
            description=f"Complaint assigned to Manager {manager_name} (ID: {assigned_officer_id}).",
            actor_type="SYSTEM",
            actor_name="AI Workload Allocator"
        ))

        # 3. Timeline Event: SLA Started
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="SLA Started",
            description=f"SLA Timer automatically initiated for {sla_hours} hours limit. Deadline: {deadline.strftime('%Y-%m-%d %H:%M UTC')}.",
            actor_type="SYSTEM",
            actor_name="SLA Timer Engine"
        ))
    else:
        # Timeline Event: Queued for Manager
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Queued for Manager",
            description="All managers are currently solving a problem. Ticket added to Pending Queue.",
            actor_type="SYSTEM",
            actor_name="Queue Manager"
        ))

    # SLA Record creation
    sla_rec = SLARecord(
        complaint_id=complaint.id,
        sla_hours=sla_hours,
        breach_risk_score=priority_score,
        is_breached=False,
        escalation_level=0
    )
    db.add(sla_rec)
    db.commit()

    return complaint

@router.get("/", response_model=List[ComplaintOut])
def list_complaints(
    ward_id: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    citizen_id: Optional[int] = None,
    officer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if status:
        query = query.filter(Complaint.status == status)
    if citizen_id:
        query = query.filter(Complaint.citizen_id == citizen_id)
    if officer_id:
        off = db.query(Officer).filter(Officer.id == officer_id).first()
        if off and off.ward_id:
            query = query.filter(
                (Complaint.assigned_officer_id == officer_id) | 
                ((Complaint.assigned_officer_id.is_(None)) & (Complaint.ward_id == off.ward_id))
            )
        else:
            query = query.filter(Complaint.assigned_officer_id == officer_id)
    
    return query.order_by(Complaint.created_at.desc()).all()

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.put("/{complaint_id}/status", response_model=ComplaintOut)
def update_status(
    complaint_id: int,
    status_in: ComplaintUpdateStatus,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = status_in.status
    if status_in.resolution_notes:
        complaint.resolution_notes = status_in.resolution_notes

    now = datetime.utcnow()
    mgr_name = complaint.assigned_officer.full_name if complaint.assigned_officer else "Manager"

    if status_in.status in ["RESOLVED", "Resolved"]:
        complaint.resolved_at = now
        freed_officer = None
        if complaint.assigned_officer_id:
            freed_officer = db.query(Officer).filter(Officer.id == complaint.assigned_officer_id).first()
            if freed_officer:
                freed_officer.active_workload = max(0, freed_officer.active_workload - 1)

        # Timeline Event: Complaint Resolved
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Complaint Resolved",
            description=f"Complaint resolved by Manager {mgr_name}. Resolution Notes: '{status_in.resolution_notes or 'Work completed successfully'}'",
            actor_type="OFFICER",
            actor_name=mgr_name
        ))

        # Notify Citizen
        notification_service.dispatch_multi_channel(
            db=db,
            recipient_type="CITIZEN",
            recipient_id=complaint.citizen_id,
            title=f"Complaint Resolved: #{complaint.complaint_number}",
            message=f"Your complaint #{complaint.complaint_number} has been resolved by Manager {mgr_name}. Please provide your feedback.",
            channels=["IN_APP", "EMAIL", "SMS"]
        )

        # Auto-dispatch pending complaint from queue if manager is now available (active_workload == 0)
        if freed_officer and freed_officer.active_workload == 0 and freed_officer.status == "ACTIVE":
            pending_c = db.query(Complaint).filter(
                Complaint.status.in_(["PENDING", "Pending"]),
                Complaint.assigned_officer_id.is_(None),
                Complaint.department_id == freed_officer.department_id
            ).order_by(Complaint.created_at.asc()).first()

            if not pending_c:
                pending_c = db.query(Complaint).filter(
                    Complaint.status.in_(["PENDING", "Pending"]),
                    Complaint.assigned_officer_id.is_(None)
                ).order_by(Complaint.created_at.asc()).first()

            if pending_c:
                dept_name_p = pending_c.department.name if pending_c.department else "General Department"
                sla_h_p = get_sla_hours_for_department(dept_name_p, pending_c.priority or "MEDIUM")
                new_deadline = now + timedelta(hours=sla_h_p)

                pending_c.assigned_officer_id = freed_officer.id
                pending_c.status = "ASSIGNED"
                pending_c.sla_started_at = now
                pending_c.sla_deadline = new_deadline
                freed_officer.active_workload = 1

                db.add(ComplaintTimeline(
                    complaint_id=pending_c.id,
                    event_type="Auto-Assigned from Queue",
                    description=f"Complaint #{pending_c.complaint_number} auto-assigned from Queue to Manager {freed_officer.full_name} as they became available.",
                    actor_type="SYSTEM",
                    actor_name="AI Queue Auto-Dispatcher"
                ))

                db.add(ComplaintTimeline(
                    complaint_id=pending_c.id,
                    event_type="SLA Started",
                    description=f"SLA Timer initiated for {sla_h_p} hours limit. Deadline: {new_deadline.strftime('%Y-%m-%d %H:%M UTC')}.",
                    actor_type="SYSTEM",
                    actor_name="SLA Timer Engine"
                ))

    elif status_in.status in ["CLOSED", "Closed"]:
        db.add(ComplaintTimeline(
            complaint_id=complaint.id,
            event_type="Complaint Closed",
            description=f"Complaint closed in system by Manager {mgr_name}.",
            actor_type="OFFICER",
            actor_name=mgr_name
        ))

    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/{complaint_id}/delay-reason", response_model=DelayReasonOut)
def submit_delay_reason(
    complaint_id: int,
    delay_in: DelayReasonCreate,
    officer_id: int = 1,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer = db.query(Officer).filter(Officer.id == (complaint.assigned_officer_id or officer_id)).first()
    off_name = officer.full_name if officer else "Manager"

    now = datetime.utcnow()
    delay_sub = DelayReasonSubmission(
        complaint_id=complaint.id,
        officer_id=officer.id if officer else officer_id,
        reason_category=delay_in.reason_category,
        expected_completion_time=delay_in.expected_completion_time,
        additional_remarks=delay_in.additional_remarks,
        admin_status="PENDING_REVIEW",
        submitted_at=now
    )
    db.add(delay_sub)
    complaint.delay_requested_at = now

    # Format expected completion safely
    exp = delay_in.expected_completion_time
    exp_str = exp.strftime('%Y-%m-%d %H:%M') if hasattr(exp, 'strftime') else str(exp)

    # Timeline event: Delay Reason Submitted
    db.add(ComplaintTimeline(
        complaint_id=complaint.id,
        event_type="Delay Reason Submitted",
        description=f"Manager {off_name} submitted delay reason: '{delay_in.reason_category}'. Expected completion: {exp_str}. Remarks: '{delay_in.additional_remarks or 'None'}'",
        actor_type="OFFICER",
        actor_name=off_name
    ))

    # Notify Admin
    notification_service.dispatch_multi_channel(
        db=db,
        recipient_type="ADMIN",
        recipient_id=1,
        title=f"DELAY EXPLANATION SUBMITTED: Ticket #{complaint.complaint_number}",
        message=f"Manager {off_name} submitted a delay explanation for ticket #{complaint.complaint_number}. Reason: '{delay_in.reason_category}'. Please review in Admin Dashboard.",
        channels=["IN_APP", "EMAIL"]
    )

    db.commit()
    db.refresh(delay_sub)
    res = DelayReasonOut.model_validate(delay_sub)
    res.officer_name = off_name
    return res

@router.get("/{complaint_id}/timeline", response_model=List[ComplaintTimelineOut])
def get_complaint_timeline(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    events = db.query(ComplaintTimeline).filter(
        ComplaintTimeline.complaint_id == complaint_id
    ).order_by(ComplaintTimeline.created_at.asc()).all()
    
    return events

@router.post("/feedback")
def submit_feedback(feedback_in: FeedbackCreate, db: Session = Depends(get_db)):
    existing = db.query(Feedback).filter(Feedback.complaint_id == feedback_in.complaint_id).first()
    if existing:
        existing.rating = feedback_in.rating
        existing.comments = feedback_in.comments
        existing.verified_resolved = feedback_in.verified_resolved
    else:
        fb = Feedback(
            complaint_id=feedback_in.complaint_id,
            citizen_id=1,
            rating=feedback_in.rating,
            comments=feedback_in.comments,
            verified_resolved=feedback_in.verified_resolved
        )
        db.add(fb)

    db.commit()
    return {"message": "Feedback submitted successfully", "status": "SUCCESS"}
