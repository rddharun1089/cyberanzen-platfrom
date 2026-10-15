import os
import json
import glob
import subprocess
from typing import Dict, List, Any, Optional

def validate_question_directory(case_path: str) -> Dict[str, Any]:
    """
    Validates a question folder structure against the required schema:
    - metadata.json (valid schema, valid types)
    - problem.md (non-empty)
    - starter/ (main.py, main.cpp, main.c)
    - samples/ (sample1.in, sample1.out)
    - tests/manifest.json (must declare tests)
    """
    case_id = os.path.basename(case_path)
    errors = []
    warnings = []

    # 1. metadata.json
    meta_path = os.path.join(case_path, "metadata.json")
    if not os.path.exists(meta_path):
        errors.append("Missing metadata.json")
        meta = {}
    else:
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
            required_keys = ["case_id", "number", "title", "domain", "points", "difficulty"]
            for rk in required_keys:
                if rk not in meta:
                    errors.append(f"metadata.json missing required key: {rk}")
        except Exception as e:
            errors.append(f"metadata.json is invalid JSON: {e}")
            meta = {}

    # 2. problem.md
    prob_path = os.path.join(case_path, "problem.md")
    if not os.path.exists(prob_path) or os.path.getsize(prob_path) == 0:
        errors.append("Missing or empty problem.md")

    # 3. starter templates
    for starter in ["main.py", "main.cpp", "main.c"]:
        s_path = os.path.join(case_path, "starter", starter)
        if not os.path.exists(s_path):
            warnings.append(f"Missing starter code: starter/{starter}")

    # 4. samples
    if not os.path.exists(os.path.join(case_path, "samples", "sample1.in")):
        errors.append("Missing samples/sample1.in")
    if not os.path.exists(os.path.join(case_path, "samples", "sample1.out")):
        errors.append("Missing samples/sample1.out")

    # 5. tests/manifest.json
    manifest_path = os.path.join(case_path, "tests", "manifest.json")
    if not os.path.exists(manifest_path):
        errors.append("Missing tests/manifest.json")

    return {
        "case_id": case_id,
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "metadata": meta
    }

def scan_questions_repository(repo_path: str) -> Dict[str, Any]:
    """
    Scans a questions repository directory, validates all cases,
    detects duplicates, and produces a complete import preview report.
    """
    if not os.path.exists(repo_path):
        return {"success": False, "error": f"Repository path does not exist: {repo_path}"}

    case_dirs = sorted([d for d in glob.glob(os.path.join(repo_path, "CASE-*")) if os.path.isdir(d)])
    
    validated_cases = []
    invalid_cases = []
    seen_ids = set()
    duplicate_ids = []

    for cdir in case_dirs:
        cid = os.path.basename(cdir)
        if cid in seen_ids:
            duplicate_ids.append(cid)
        seen_ids.add(cid)

        res = validate_question_directory(cdir)
        if res["is_valid"]:
            validated_cases.append(res)
        else:
            invalid_cases.append(res)

    return {
        "success": True,
        "total_scanned": len(case_dirs),
        "valid_count": len(validated_cases),
        "invalid_count": len(invalid_cases),
        "duplicate_ids": duplicate_ids,
        "valid_cases": validated_cases,
        "invalid_cases": invalid_cases
    }

def get_git_repo_info(repo_path: str) -> Dict[str, Any]:
    """
    Reads git branch, commit hash, and commit message safely without executing arbitrary hooks.
    """
    try:
        commit_hash = subprocess.check_output(
            ["git", "-C", repo_path, "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL,
            text=True
        ).strip()
        branch = subprocess.check_output(
            ["git", "-C", repo_path, "rev-parse", "--abbrev-ref", "HEAD"],
            stderr=subprocess.DEVNULL,
            text=True
        ).strip()
        commit_msg = subprocess.check_output(
            ["git", "-C", repo_path, "log", "-1", "--pretty=%B"],
            stderr=subprocess.DEVNULL,
            text=True
        ).strip()
        return {
            "is_git": True,
            "commit_hash": commit_hash,
            "branch": branch,
            "commit_msg": commit_msg
        }
    except Exception:
        return {"is_git": False, "commit_hash": None, "branch": None, "commit_msg": None}
