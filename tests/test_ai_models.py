import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import pytest
from ai_models.telugu_speech_handler import TeluguSpeechProcessor

def test_telugu_speech_intent_detection():
    processor = TeluguSpeechProcessor()
    
    # Test Water Complaint
    water_res = processor.process_speech_file(None, "మా వీధిలో మంచినీటి పైపులైన్ పగిలి నీరు అంతా వృధాగా పోతోంది.")
    assert water_res["detected_department"] == "Water Supply & Sanitation"
    assert water_res["priority"] in ["HIGH", "CRITICAL"]

    # Test Electricity Complaint
    elec_res = processor.process_speech_file(None, "స్ట్రీట్ లైట్లు పని చేయడం లేదు, రాత్రిపూట చీకటిగా ఉంది.")
    assert elec_res["detected_department"] == "Electricity & Power Grid"
