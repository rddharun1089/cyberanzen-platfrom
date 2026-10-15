import pytest
import hashlib
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.services.evidence_engine import compute_evidence_token, verify_token_submission, build_case_80_final_convergence

def test_token_derivation():
    tok1 = compute_evidence_token(1, "admin")
    assert tok1 == "FLAG{CASE_01_admin}"
    tok2 = compute_evidence_token(25, "42")
    assert tok2 == "FLAG{CASE_25_42}"

def test_token_verification():
    assert verify_token_submission(1, "FLAG{CASE_01_admin}", "FLAG{CASE_01_admin}") is True
    assert verify_token_submission(1, "FLAG{CASE_01_admin}", "flag{case_01_admin}") is True
    assert verify_token_submission(1, "FLAG{CASE_01_admin}", "FLAG{WRONG}") is False

def test_case_80_final_convergence_deterministic():
    # 79 simulated tokens
    tokens = [{"case_number": i, "token_value": f"TOK_{i}"} for i in range(1, 80)]
    res = build_case_80_final_convergence(tokens)
    
    assert res["is_complete"] is True
    assert res["token_count"] == 79
    assert res["total_required"] == 79
    assert res["master_flag"].startswith("FLAG{")
    assert len(res["master_flag"]) == 5 + 16 + 1  # "FLAG{" + 16 chars + "}"

    # Verify deterministic hash matches exact reference solution algorithm
    expected_chain = "|".join(f"{i}:TOK_{i}" for i in range(1, 80))
    expected_digest = hashlib.sha256(expected_chain.encode("utf-8")).hexdigest()[:16]
    assert res["master_flag"] == f"FLAG{{{expected_digest}}}"
