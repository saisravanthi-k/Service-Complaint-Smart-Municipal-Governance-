import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import pytest
from app.services.escalation_service import EscalationEngine

def test_escalation_engine_instantiation():
    engine = EscalationEngine()
    assert engine is not None
