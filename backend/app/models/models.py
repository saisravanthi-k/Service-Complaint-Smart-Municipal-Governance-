from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WardAnalytics(Base):
    __tablename__ = "ward_analytics"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(String(50), unique=True, index=True, nullable=False)
    ward_name = Column(String(100), nullable=False)
    population = Column(Integer, default=50000)
    total_issues = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    vulnerability_index = Column(Float, default=0.5)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    coordinates_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    citizens = relationship("Citizen", back_populates="ward")
    officers = relationship("Officer", back_populates="ward")
    complaints = relationship("Complaint", back_populates="ward")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    default_sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)

    officers = relationship("Officer", back_populates="department")
    services = relationship("Service", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    ward_id = Column(String(50), ForeignKey("ward_analytics.ward_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward = relationship("WardAnalytics", back_populates="citizens")
    complaints = relationship("Complaint", back_populates="citizen")

class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    ward_id = Column(String(50), ForeignKey("ward_analytics.ward_id"), nullable=True)
    rank = Column(String(50), default="Junior Engineer")
    active_workload = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="officers")
    ward = relationship("WardAnalytics", back_populates="officers")
    assigned_complaints = relationship("Complaint", back_populates="assigned_officer")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    service_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="services")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(50), unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("citizens.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    ward_id = Column(String(50), ForeignKey("ward_analytics.ward_id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    speech_audio_url = Column(Text, nullable=True)
    language = Column(String(20), default="Telugu")
    status = Column(String(50), default="PENDING")
    priority = Column(String(20), default="MEDIUM")
    priority_score = Column(Float, default=50.0)
    sla_deadline = Column(DateTime, nullable=False)
    sla_started_at = Column(DateTime, default=datetime.utcnow)
    violated_at = Column(DateTime, nullable=True)
    delay_requested_at = Column(DateTime, nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship("Citizen", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    ward = relationship("WardAnalytics", back_populates="complaints")
    assigned_officer = relationship("Officer", back_populates="assigned_complaints")
    sla_record = relationship("SLARecord", back_populates="complaint", uselist=False)
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)
    timeline_events = relationship("ComplaintTimeline", back_populates="complaint", cascade="all, delete-orphan")
    delay_submissions = relationship("DelayReasonSubmission", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintTimeline(Base):
    __tablename__ = "complaint_timeline"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    actor_type = Column(String(50), default="SYSTEM")
    actor_name = Column(String(100), default="System Engine")
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="timeline_events")

class DelayReasonSubmission(Base):
    __tablename__ = "delay_reason_submissions"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=False)
    reason_category = Column(String(100), nullable=False)
    expected_completion_time = Column(DateTime, nullable=False)
    additional_remarks = Column(Text, nullable=True)
    admin_status = Column(String(50), default="PENDING_REVIEW")
    admin_action_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    complaint = relationship("Complaint", back_populates="delay_submissions")
    officer = relationship("Officer")

class SLARecord(Base):
    __tablename__ = "sla_records"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    sla_hours = Column(Integer, nullable=False)
    breach_risk_score = Column(Float, default=0.0)
    is_breached = Column(Boolean, default=False)
    breach_time = Column(DateTime, nullable=True)
    resolution_time_hours = Column(Float, nullable=True)
    escalation_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="sla_record")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("citizens.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    verified_resolved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="feedback")

class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    score = Column(Float, default=100.0)
    rank_position = Column(Integer, nullable=True)
    resolution_rate = Column(Float, default=0.0)
    avg_sla_hours = Column(Float, default=0.0)
    period_month = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_type = Column(String(50), nullable=False)
    recipient_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(50), default="IN_APP")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    ward_id = Column(String(50), ForeignKey("ward_analytics.ward_id"), nullable=True)
    month_year = Column(String(20), nullable=False)
    total_complaints = Column(Integer, default=0)
    resolved_complaints = Column(Integer, default=0)
    avg_resolution_time = Column(Float, default=0.0)
    breach_rate = Column(Float, default=0.0)
    summary_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=True)
    risk_score = Column(Float, default=0.0)
    input_features = Column(Text, nullable=True)
    prediction_result = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
