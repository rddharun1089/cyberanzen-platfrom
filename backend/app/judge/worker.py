import os
import tempfile
import shutil
from typing import List, Dict, Any, Tuple
from app.judge.sandbox import compile_source, run_test_case, ExecutionResult

def evaluate_submission(
    language: str,
    source_code: str,
    test_cases: List[Dict[str, Any]],  # list of {"id": str, "input": str, "output": str, "points": int, "type": str}
    time_limit_ms: int = 2000,
    memory_limit_mb: int = 256,
    is_sample_run: bool = False
) -> Dict[str, Any]:
    """
    Evaluates participant code inside a safe temporary sandbox directory.
    Never executes untrusted code in the main web server process.
    """
    temp_dir = tempfile.mkdtemp(prefix="judge_run_")
    try:
        # Step 1: Compilation
        comp_res = compile_source(temp_dir, language, source_code)
        if not comp_res["success"]:
            return {
                "verdict": "COMPILE_ERROR",
                "score": 0,
                "execution_time_ms": 0,
                "memory_kb": 0,
                "compile_log": comp_res["compile_log"],
                "test_results": []
            }

        binary_path = comp_res["binary_path"]
        compile_log = comp_res.get("compile_log", "")

        # Step 2: Test Case Iteration
        total_score = 0
        max_exec_time = 0
        overall_verdict = "ACCEPTED"
        test_results = []

        for tc in test_cases:
            # If sample run and this is hidden test, skip
            if is_sample_run and tc.get("type") == "hidden_test":
                continue

            res = run_test_case(
                binary_path=binary_path,
                language=language,
                input_data=tc["input"],
                expected_output=tc["output"],
                time_limit_ms=time_limit_ms,
                memory_limit_mb=memory_limit_mb
            )

            max_exec_time = max(max_exec_time, res.exec_time_ms)
            
            passed = (res.verdict == "ACCEPTED")
            awarded = tc.get("points", 0) if passed else 0
            total_score += awarded

            # Record individual test result (hide input/output if hidden test)
            test_info = {
                "id": tc.get("id", "test"),
                "type": tc.get("type", "sample"),
                "verdict": res.verdict,
                "exec_time_ms": res.exec_time_ms,
                "points_awarded": awarded
            }
            # Only reveal stdout/stderr and inputs for public samples or sample runs
            if tc.get("type") == "public_sample" or is_sample_run:
                test_info["actual_output"] = res.stdout
                test_info["error"] = res.stderr
                test_info["input"] = tc["input"]
                test_info["expected_output"] = tc["output"]
            else:
                test_info["actual_output"] = "[HIDDEN]"
                test_info["error"] = "[HIDDEN]"

            test_results.append(test_info)

            # Update overall verdict on first failure
            if res.verdict != "ACCEPTED" and overall_verdict == "ACCEPTED":
                overall_verdict = res.verdict

        return {
            "verdict": overall_verdict,
            "score": total_score,
            "execution_time_ms": max_exec_time,
            "memory_kb": 0,
            "compile_log": compile_log,
            "test_results": test_results
        }

    finally:
        # Cleanup temporary execution directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
