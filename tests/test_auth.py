import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend"))

import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    raw_pwd = "citizen123_secure"
    pwd_hash = get_password_hash(raw_pwd)
    assert verify_password(raw_pwd, pwd_hash) is True
    assert verify_password("wrong_password", pwd_hash) is False

def test_jwt_token_generation():
    payload = {"sub": "citizen@telangana.gov.in", "user_type": "citizen", "id": 1}
    token = create_access_token(payload)
    assert token is not None

    decoded = decode_access_token(token)
    assert decoded["sub"] == "citizen@telangana.gov.in"
    assert decoded["user_type"] == "citizen"
