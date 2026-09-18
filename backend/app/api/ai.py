from fastapi import APIRouter, Depends, UploadFile, File
from app.schemas.schemas import SLAPredictRequest, SLAPredictResponse, TeluguSpeechRequest, TeluguSpeechResponse
from app.services.ai_service import ai_service
from app.services.speech_service import process_telugu_voice_input

router = APIRouter(prefix="/ai", tags=["AI & Predictions"])

@router.post("/predict-sla", response_model=SLAPredictResponse)
def predict_sla_breach(req: SLAPredictRequest):
    return ai_service.predict_sla_risk(
        department_id=req.department_id,
        ward_id=req.ward_id,
        priority=req.priority,
        sla_hours=req.sla_hours,
        officer_workload=req.officer_workload
    )

@router.get("/predict-hotspots")
def predict_hotspots():
    return ai_service.predict_ward_hotspots()

@router.post("/telugu-speech", response_model=TeluguSpeechResponse)
def process_telugu_speech(req: TeluguSpeechRequest):
    res = process_telugu_voice_input(text_input=req.telugu_text)
    return res

@router.post("/telugu-voice-file")
async def process_voice_file(file: UploadFile = File(...)):
    # Simulates Whisper processing of uploaded binary audio file (.mp3 / .wav / .webm)
    res = process_telugu_voice_input(audio_file_path=file.filename, text_input=None)
    return res

@router.get("/recommendations")
def get_recommendations():
    return ai_service.generate_dynamic_recommendations()
