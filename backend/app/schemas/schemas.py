from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: int
    full_name: str
    email: str
    department_id: Optional[int] = None
    ward_id: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None

# User Register & Login
class UserRegister(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    address: Optional[str] = None
    ward_id: Optional[str] = "WARD-01"

class UserLogin(BaseModel):
    email: str
    password: str

# Complaint Schemas
class ComplaintCreate(BaseModel):
    title: str
    description: str
    department_id: Optional[int] = 1
    service_id: Optional[int] = 1
    ward_id: Optional[str] = "WARD-01"
    language: Optional[str] = "Telugu"
    priority: Optional[str] = "MEDIUM"
    speech_audio_url: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = 17.3616
    longitude: Optional[float] = 78.4747
    address: Optional[str] = "Municipal Ward 1, Hyderabad"


class ComplaintUpdateStatus(BaseModel):
    status: str
    resolution_notes: Optional[str] = None

class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_number: str
    citizen_id: int
    department_id: Optional[int]
    service_id: Optional[int]
    ward_id: Optional[str]
    title: str
    description: str
    language: str
    status: str
    priority: str
    priority_score: float
    sla_deadline: datetime
    assigned_officer_id: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Officer Allocation
class OfficerAllocate(BaseModel):
    complaint_id: int
    officer_id: int

# Feedback Schema
class FeedbackCreate(BaseModel):
    complaint_id: int
    rating: int
    comments: Optional[str] = None
    verified_resolved: Optional[bool] = True

# AI Prediction Request & Response
class SLAPredictRequest(BaseModel):
    department_id: int
    ward_id: str
    priority: str
    sla_hours: int
    officer_workload: int

class SLAPredictResponse(BaseModel):
    breach_risk_score: float
    is_high_risk: bool
    risk_level: str
    recommendation: str

class TeluguSpeechRequest(BaseModel):
    telugu_text: Optional[str] = None

class TeluguSpeechResponse(BaseModel):
    telugu_transcript: str
    english_translation: str
    detected_department: str
    priority: str
    suggested_sla_hours: int
    confidence_score: float

# Delay Reason & SLA Escalation Schemas
class DelayReasonCreate(BaseModel):
    reason_category: str  # e.g., 'Heavy rainfall', 'Water supply pipeline materials unavailable', 'Lack of manpower', 'Awaiting approval', 'Technical issue', 'Other'
    expected_completion_time: datetime
    additional_remarks: Optional[str] = None

class DelayReasonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    officer_id: int
    officer_name: Optional[str] = None
    reason_category: str
    expected_completion_time: datetime
    additional_remarks: Optional[str] = None
    admin_status: str
    admin_action_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

class AdminDelayReview(BaseModel):
    action: str  # 'ACCEPT', 'REJECT', 'EXTEND', 'REASSIGN', 'ESCALATE'
    action_notes: Optional[str] = None
    extended_deadline: Optional[datetime] = None
    new_officer_id: Optional[int] = None

class ComplaintTimelineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: int
    event_type: str
    description: str
    actor_type: str
    actor_name: str
    created_at: datetime

class SLADashboardMetrics(BaseModel):
    total_sla_violations: int
    number_of_delayed_complaints: int
    complaints_awaiting_explanation: int
    complaints_reassigned: int
    high_priority_complaints: int
    average_resolution_time_hours: float
    manager_wise_delay_reports: List[dict]

class ManagerPerformanceReport(BaseModel):
    officer_id: int
    officer_name: str
    department_name: str
    total_assigned: int
    total_resolved: int = 0
    total_rectified: int = 0
    resolution_rate: float = 0.0
    resolved_on_time: int = 0
    delayed_complaints: int = 0
    sla_violations_count: int = 0
    on_time_resolution_rate: float = 100.0
    avg_response_time_hours: float = 1.2
    avg_resolution_time_hours: float = 8.5
    feedback_rating: float = 4.8
    monthly_stats: List[dict] = []
    badges: List[dict] = []


