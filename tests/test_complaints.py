import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import pytest
from app.services.ai_service import ai_service

def test_sla_risk_prediction():
    res = ai_service.predict_sla_risk(
        department_id=1,
        ward_id="WARD-01",
        priority="HIGH",
        sla_hours=12,
        officer_workload=8
    )
    assert "breach_risk_score" in res
    assert "is_high_risk" in res
    assert res["risk_level"] in ["NORMAL", "HIGH", "CRITICAL"]

def test_hotspot_predictions():
    hotspots = ai_service.predict_ward_hotspots()
    assert isinstance(hotspots, list)
    assert len(hotspots) > 0
    assert "ward_id" in hotspots[0]
