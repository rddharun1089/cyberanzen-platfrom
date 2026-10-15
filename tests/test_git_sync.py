import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.services.git_service import scan_questions_repository, validate_question_directory, get_git_repo_info

def test_git_service_scan():
    res = scan_questions_repository("questions")
    assert res["success"] is True
    assert res["total_scanned"] == 80
    assert res["valid_count"] == 80
    assert res["invalid_count"] == 0
    assert res["duplicate_ids"] == []

def test_git_service_detect_invalid_case(tmp_path):
    bad_case = tmp_path / "CASE-99"
    bad_case.mkdir()
    # Missing metadata, problem.md, tests
    res = validate_question_directory(str(bad_case))
    assert res["is_valid"] is False
    assert len(res["errors"]) > 0

def test_git_repo_info():
    info = get_git_repo_info(".")
    assert info["is_git"] is True
    assert info["branch"] in ["main", "master"]
    assert info["commit_hash"] is not None
