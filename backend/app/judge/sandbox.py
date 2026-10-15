import os
import sys
import time
import subprocess
import tempfile
import shutil
import resource
from typing import Dict, Any, Optional

def set_sandbox_limits(time_limit_sec: int = 3, memory_limit_mb: int = 256):
    """
    Apply resource limits to the child process before execution.
    Restricts CPU time, virtual memory, process creation, file output size, and core dumps.
    """
    def preexec():
        # CPU time limit (soft limit = time_limit_sec, hard limit = time_limit_sec + 1)
        resource.setrlimit(resource.RLIMIT_CPU, (time_limit_sec + 1, time_limit_sec + 2))
        
        # Memory limit (in bytes)
        mem_bytes = memory_limit_mb * 1024 * 1024
        try:
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
        except (ValueError, OSError):
            pass  # Some Linux kernels or container limits may constrain RLIMIT_AS adjustments

        # Max file size created (5 MB)
        resource.setrlimit(resource.RLIMIT_FSIZE, (5 * 1024 * 1024, 5 * 1024 * 1024))
        
        # Max child processes/threads (fork bomb protection)
        try:
            resource.setrlimit(resource.RLIMIT_NPROC, (30, 30))
        except (ValueError, OSError):
            pass

        # Disable core dumps
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))

        # Max open file descriptors (prevent FD leakage/exhaustion)
        try:
            resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
        except (ValueError, OSError):
            pass

    return preexec

class ExecutionResult:
    def __init__(self, verdict: str, stdout: str = "", stderr: str = "", exec_time_ms: int = 0, memory_kb: int = 0):
        self.verdict = verdict  # ACCEPTED, WRONG_ANSWER, COMPILE_ERROR, TIME_LIMIT_EXCEEDED, RUNTIME_ERROR
        self.stdout = stdout
        self.stderr = stderr
        self.exec_time_ms = exec_time_ms
        self.memory_kb = memory_kb

def compile_source(work_dir: str, language: str, source_code: str) -> Dict[str, Any]:
    """
    Compiles C or C++ source code.
    Returns {"success": bool, "binary_path": Optional[str], "compile_log": str}
    """
    if language == "python3":
        src_path = os.path.join(work_dir, "solution.py")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(source_code)
        # Test python compilation syntax
        try:
            compile(source_code, "solution.py", "exec")
            return {"success": True, "binary_path": src_path, "compile_log": ""}
        except SyntaxError as e:
            return {"success": False, "binary_path": None, "compile_log": f"SyntaxError: {e}"}

    elif language == "c":
        src_path = os.path.join(work_dir, "main.c")
        bin_path = os.path.join(work_dir, "solution")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(source_code)
        
        cmd = ["gcc", "-O2", "-std=c11", "-Wall", "-o", bin_path, src_path, "-lm"]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if proc.returncode != 0:
            return {"success": False, "binary_path": None, "compile_log": proc.stderr or proc.stdout}
        return {"success": True, "binary_path": bin_path, "compile_log": proc.stderr}

    elif language == "cpp":
        src_path = os.path.join(work_dir, "main.cpp")
        bin_path = os.path.join(work_dir, "solution")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(source_code)
        
        cmd = ["g++", "-O2", "-std=c++17", "-Wall", "-o", bin_path, src_path]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if proc.returncode != 0:
            return {"success": False, "binary_path": None, "compile_log": proc.stderr or proc.stdout}
        return {"success": True, "binary_path": bin_path, "compile_log": proc.stderr}

    return {"success": False, "binary_path": None, "compile_log": f"Unsupported language: {language}"}

def run_test_case(binary_path: str, language: str, input_data: str, expected_output: str, time_limit_ms: int = 2000, memory_limit_mb: int = 256) -> ExecutionResult:
    """
    Executes compiled binary / script against a single test case input.
    """
    time_limit_sec = max(1, time_limit_ms // 1000)
    timeout_val = (time_limit_ms / 1000.0) + 0.5  # Subprocess wall-clock grace buffer

    if language == "python3":
        exec_cmd = [sys.executable, "-B", "-I", binary_path]
    else:
        exec_cmd = [binary_path]

    preexec = set_sandbox_limits(time_limit_sec=time_limit_sec, memory_limit_mb=memory_limit_mb)

    start_time = time.perf_counter()
    try:
        proc = subprocess.run(
            exec_cmd,
            input=input_data,
            text=True,
            capture_output=True,
            timeout=timeout_val,
            preexec_fn=preexec,
            env={"PATH": "/usr/bin:/bin", "LC_ALL": "C.UTF-8"}
        )
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        if proc.returncode != 0:
            # Check for SIGXCPU (code -24) or SIGSEGV (code -11)
            if proc.returncode in (-24, 137):
                return ExecutionResult(verdict="TIME_LIMIT_EXCEEDED", stderr="Time Limit Exceeded", exec_time_ms=elapsed_ms)
            return ExecutionResult(verdict="RUNTIME_ERROR", stderr=proc.stderr[:1000], exec_time_ms=elapsed_ms)

        # Normalize stdout and expected
        actual_norm = "\n".join([line.rstrip() for line in proc.stdout.strip().splitlines()])
        expected_norm = "\n".join([line.rstrip() for line in expected_output.strip().splitlines()])

        if actual_norm == expected_norm:
            return ExecutionResult(verdict="ACCEPTED", stdout=proc.stdout[:2000], exec_time_ms=elapsed_ms)
        else:
            return ExecutionResult(verdict="WRONG_ANSWER", stdout=proc.stdout[:2000], exec_time_ms=elapsed_ms)

    except subprocess.TimeoutExpired:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return ExecutionResult(verdict="TIME_LIMIT_EXCEEDED", stderr="Execution Timed Out", exec_time_ms=elapsed_ms)
    except Exception as e:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return ExecutionResult(verdict="RUNTIME_ERROR", stderr=str(e), exec_time_ms=elapsed_ms)
