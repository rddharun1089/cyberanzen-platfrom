import pytest
import os
import glob
import json
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.services.git_service import validate_question_directory, scan_questions_repository

def test_all_80_cases_schema_valid():
    repo_path = "questions"
    scan_res = scan_questions_repository(repo_path)
    assert scan_res["success"] is True
    assert scan_res["total_scanned"] == 80
    assert scan_res["duplicate_ids"] == []
    assert scan_res["invalid_count"] == 0
    assert scan_res["valid_count"] == 80

def test_starter_code_templates():
    for i in range(1, 81):
        cid = f"CASE-{i:02d}"
        q_dir = os.path.join("questions", cid)
        
        py_starter = os.path.join(q_dir, "starter", "main.py")
        cpp_starter = os.path.join(q_dir, "starter", "main.cpp")
        c_starter = os.path.join(q_dir, "starter", "main.c")
        
        assert os.path.exists(py_starter)
        assert os.path.exists(cpp_starter)
        assert os.path.exists(c_starter)

        # Starter files must not be empty
        assert os.path.getsize(py_starter) > 0
        assert os.path.getsize(cpp_starter) > 0
        assert os.path.getsize(c_starter) > 0
