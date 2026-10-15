import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.db.session import SessionLocal
from app.db.models import Case, TestCase
from app.judge.worker import evaluate_submission

def test_database_has_all_80_validated_cases():
    db = SessionLocal()
    cases = db.query(Case).all()
    assert len(cases) == 80
    for c in cases:
        assert c.validation_status == "VALIDATED"
        assert c.publication_status == "PUBLISHED"
        assert len(c.reference_solution.strip()) > 0
        
        # Verify 3 test cases exist (1 sample, 2 hidden)
        tcs = db.query(TestCase).filter(TestCase.case_id == c.id).all()
        assert len(tcs) == 3, f"Case {c.id} has {len(tcs)} test cases instead of 3"
        
        # Verify no placeholder output
        for tc in tcs:
            assert tc.expected_output.strip() != "SAMPLE", f"Case {c.id} still has SAMPLE placeholder!"
            assert tc.expected_output.strip() != "TEST1", f"Case {c.id} still has TEST1 placeholder!"
            assert tc.expected_output.strip() != "TEST2", f"Case {c.id} still has TEST2 placeholder!"
            assert len(tc.input_data.strip()) > 0
            assert tc.expected_output is not None

    db.close()

def test_sample_case_evaluation_accuracy():
    # Test a representative sample of cases from all phases (e.g. 1, 10, 20, 30, 40, 50, 60, 70, 80)
    db = SessionLocal()
    sample_cids = [f"CASE-{i:02d}" for i in [1, 10, 20, 25, 35, 47, 55, 68, 75, 80]]
    for cid in sample_cids:
        c = db.query(Case).filter(Case.id == cid).first()
        tcs = db.query(TestCase).filter(TestCase.case_id == cid).order_by(TestCase.test_type, TestCase.test_index).all()
        
        judge_tests = [
            {"id": str(tc.id), "type": tc.test_type, "input": tc.input_data, "output": tc.expected_output, "points": tc.points}
            for tc in tcs
        ]
        
        res = evaluate_submission(
            language="python3",
            source_code=c.reference_solution,
            test_cases=judge_tests,
            time_limit_ms=2000,
            memory_limit_mb=256
        )
        assert res["verdict"] == "ACCEPTED", f"{cid} failed judge evaluation: {res}"
        assert res["score"] == c.points, f"{cid} scored {res['score']} instead of {c.points}"
    db.close()
