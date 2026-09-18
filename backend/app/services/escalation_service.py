from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import Complaint, SLARecord, Officer, Citizen, Department, DelayReasonSubmission, ComplaintTimeline
from app.services.notification_service import notification_service

class EscalationEngine:
    """
    AI-Based SLA Escalation & Manager Accountability Engine for GVMC Service Complaint Management:
    
    1. SLA Violation Detection:
       - Automatically detects when SLA deadline is exceeded for PENDING, ASSIGNED, IN_PROGRESS complaints.
       - Marks status as 'SLA Violated'.
       - Sends structured Admin & Manager notifications across channels.
       - Logs timestamped 'SLA Violated' timeline event.
       
    2. 30-Minute Rule:
       - If Manager does NOT submit delay reason within 30 minutes of SLA breach:
         * Sends reminder notification.
         * Marks complaint as 'Escalated'.
         * Notifies Admin immediately.
         
    3. 1-Hour Rule:
       - If no response / resolution after 1 hour post breach:
         * Auto-escalates ticket to Commissioner with high-priority alert.
    """
    def evaluate_and_escalate(self, db: Session) -> dict:
        now = datetime.utcnow()
        open_complaints = db.query(Complaint).filter(
            Complaint.status.in_(["PENDING", "ASSIGNED", "IN_PROGRESS", "SLA Violated", "SLA_VIOLATED", "ESCALATED"])
        ).all()

        sla_violated_count = 0
        min_30_escalations = 0
        hour_1_escalations = 0

        for complaint in open_complaints:
            # Initialize SLA Record if missing
            sla_rec = db.query(SLARecord).filter(SLARecord.complaint_id == complaint.id).first()
            if not sla_rec:
                sla_rec = SLARecord(
                    complaint_id=complaint.id,
                    sla_hours=24,
                    escalation_level=0
                )
                db.add(sla_rec)
                db.commit()
                db.refresh(sla_rec)

            deadline = complaint.sla_deadline
            if not deadline:
                continue

            # Calculate Delay Duration if breached
            is_overdue = now > deadline
            delay_seconds = (now - deadline).total_seconds() if is_overdue else 0
            delay_hours = round(delay_seconds / 3600.0, 1)

            # Extract relationships details for notifications
            citizen_name = complaint.citizen.full_name if complaint.citizen else "Citizen"
            category = complaint.department.name if complaint.department else "General Municipal Service"
            manager_name = complaint.assigned_officer.full_name if complaint.assigned_officer else "Unassigned Manager"
            manager_id = complaint.assigned_officer_id or 1

            # -------------------------------------------------------------
            # Step 1: SLA Breach Detection (First Time Breached)
            # -------------------------------------------------------------
            if is_overdue and complaint.status in ["PENDING", "ASSIGNED", "IN_PROGRESS"]:
                complaint.status = "SLA Violated"
                if not complaint.violated_at:
                    complaint.violated_at = now
                sla_rec.is_breached = True
                sla_rec.breach_time = deadline
                sla_rec.escalation_level = max(sla_rec.escalation_level, 1)
                sla_violated_count += 1

                # Timeline entry
                timeline_entry = ComplaintTimeline(
                    complaint_id=complaint.id,
                    event_type="SLA Violated",
                    description=f"Complaint exceeded allotted SLA limit of {sla_rec.sla_hours} hours. Overdue by {delay_hours} hours.",
                    actor_type="SYSTEM",
                    actor_name="AI SLA Escalation Engine"
                )
                db.add(timeline_entry)

                # Admin Notification
                admin_msg = (
                    f"Complaint {complaint.complaint_number} has exceeded its SLA time limit. "
                    f"Manager {manager_name} has not completed the work within the allotted time. "
                    f"Kindly review the complaint and request the reason for the delay.\n"
                    f"[Details: Citizen: {citizen_name} | Category: {category} | SLA Limit: {sla_rec.sla_hours}h | "
                    f"Delay: {delay_hours}h | Status: SLA Violated]"
                )
                notification_service.dispatch_multi_channel(
                    db=db,
                    recipient_type="ADMIN",
                    recipient_id=1,
                    title=f"SLA VIOLATION ALERT: Ticket #{complaint.complaint_number}",
                    message=admin_msg,
                    channels=["IN_APP", "EMAIL"]
                )

                # Manager Notification
                mgr_msg = (
                    f"You have exceeded the SLA time limit for Complaint {complaint.complaint_number}. "
                    f"Please provide the reason for not completing the assigned work immediately."
                )
                notification_service.dispatch_multi_channel(
                    db=db,
                    recipient_type="OFFICER",
                    recipient_id=manager_id,
                    title=f"URGENT SLA BREACH ACTION REQUIRED: Ticket #{complaint.complaint_number}",
                    message=mgr_msg,
                    channels=["IN_APP", "EMAIL", "SMS"]
                )

                # Send Timeline Notification entry
                notif_timeline = ComplaintTimeline(
                    complaint_id=complaint.id,
                    event_type="Notification Sent",
                    description=f"Instant SLA violation alerts dispatched to Admin and Manager {manager_name} via In-app, Email & SMS.",
                    actor_type="SYSTEM",
                    actor_name="Notification Service"
                )
                db.add(notif_timeline)

            # -------------------------------------------------------------
            # Step 2: 30-Minute Automatic Escalation Rule
            # -------------------------------------------------------------
            # Check if delay reason submitted
            existing_delay = db.query(DelayReasonSubmission).filter(
                DelayReasonSubmission.complaint_id == complaint.id
            ).first()

            violated_time = complaint.violated_at or deadline
            mins_since_violation = (now - violated_time).total_seconds() / 60.0

            if is_overdue and not existing_delay and mins_since_violation >= 30.0 and sla_rec.escalation_level < 2:
                sla_rec.escalation_level = 2
                complaint.status = "Escalated"
                min_30_escalations += 1

                # Timeline entry
                timeline_entry = ComplaintTimeline(
                    complaint_id=complaint.id,
                    event_type="Escalated",
                    description="Auto-escalated to Level-2 Admin because Manager failed to submit delay reason within 30 minutes of SLA breach.",
                    actor_type="SYSTEM",
                    actor_name="AI SLA Escalation Engine"
                )
                db.add(timeline_entry)

                # Manager Reminder
                mgr_reminder = f"REMINDER: You have not submitted a delay reason for Complaint {complaint.complaint_number} within 30 minutes. Ticket is now Escalated!"
                notification_service.dispatch_multi_channel(
                    db=db,
                    recipient_type="OFFICER",
                    recipient_id=manager_id,
                    title=f"30-MIN SLA ESCALATION WARNING: Ticket #{complaint.complaint_number}",
                    message=mgr_reminder,
                    channels=["IN_APP", "SMS"]
                )

                # Admin Escalation Notice
                admin_esc_msg = f"ESCALATION ALERT: Manager {manager_name} failed to submit delay explanation within 30 minutes for ticket #{complaint.complaint_number}. Immediate administrative review required."
                notification_service.dispatch_multi_channel(
                    db=db,
                    recipient_type="ADMIN",
                    recipient_id=1,
                    title=f"AUTOMATIC 30-MIN ESCALATION: Ticket #{complaint.complaint_number}",
                    message=admin_esc_msg,
                    channels=["IN_APP", "EMAIL"]
                )

            # -------------------------------------------------------------
            # Step 3: 1-Hour Automatic Escalation to Commissioner Rule
            # -------------------------------------------------------------
            if is_overdue and mins_since_violation >= 60.0 and sla_rec.escalation_level < 3:
                sla_rec.escalation_level = 3
                complaint.status = "Escalated"
                hour_1_escalations += 1

                # Timeline entry
                timeline_entry = ComplaintTimeline(
                    complaint_id=complaint.id,
                    event_type="Escalated to Commissioner",
                    description="High-priority automatic escalation to Municipal Commissioner due to 1-hour unaddressed SLA breach.",
                    actor_type="SYSTEM",
                    actor_name="AI SLA Escalation Engine"
                )
                db.add(timeline_entry)

                # Commissioner Alert
                comm_msg = (
                    f"COMMISSIONER CRITICAL ALERT: Complaint {complaint.complaint_number} ({complaint.title}) "
                    f"assigned to Manager {manager_name} remains unresolved & unaddressed 1 hour post-breach. "
                    f"Delay Duration: {delay_hours} hours. Immediate high-level intervention required."
                )
                notification_service.dispatch_multi_channel(
                    db=db,
                    recipient_type="COMMISSIONER",
                    recipient_id=1,
                    title=f"COMMISSIONER ALERT: Ticket #{complaint.complaint_number} 1-Hour Unaddressed Breach",
                    message=comm_msg,
                    channels=["IN_APP", "EMAIL", "SMS"]
                )

        db.commit()

        return {
            "evaluated_tickets": len(open_complaints),
            "new_sla_violations": sla_violated_count,
            "min_30_escalations": min_30_escalations,
            "hour_1_commissioner_escalations": hour_1_escalations,
            "status": "SUCCESS"
        }

escalation_engine = EscalationEngine()
