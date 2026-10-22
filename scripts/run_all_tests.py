#!/usr/bin/env python3
"""
Master Test Runner for CyberAnzen Platform.
Executes all unit, integration, judge sandbox, auth, schema, and API tests.
"""

import subprocess
import sys
import os

def main():
    print("=" * 70)
    print("RUNNING CYBERANZEN MASTER TEST SUITE")
    print("=" * 70)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pytest_bin = os.path.join(base_dir, "venv", "bin", "pytest")
    if not os.path.exists(pytest_bin):
        pytest_bin = "pytest"

    test_files = [
        os.path.join(base_dir, "tests", "test_arena_platform.py"),
        os.path.join(base_dir, "tests", "test_judge_sandbox.py"),
        os.path.join(base_dir, "tests", "test_user_deletion.py"),
        os.path.join(base_dir, "tests", "test_auth_rbac.py"),
    ]

    cmd = [pytest_bin] + test_files + ["-v"]
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(base_dir, "backend")
    res = subprocess.run(cmd, cwd=base_dir, env=env)

    print("=" * 70)
    if res.returncode == 0:
        print("ALL TESTS PASSED SUCCESSFULLY.")
    else:
        print("TEST SUITE FAILED.")
    print("=" * 70)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
