import pytest
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.judge.worker import evaluate_submission

def test_python_accepted():
    code = """
n = int(input())
for _ in range(n):
    a, b = map(int, input().split())
    print(a + b)
"""
    tests = [
        {"id": "1", "type": "public_sample", "input": "2\n3 4\n10 20\n", "output": "7\n30\n", "points": 50}
    ]
    res = evaluate_submission("python3", code, tests)
    assert res["verdict"] == "ACCEPTED"
    assert res["score"] == 50

def test_python_wrong_answer():
    code = "print(123)"
    tests = [
        {"id": "1", "type": "public_sample", "input": "", "output": "456", "points": 50}
    ]
    res = evaluate_submission("python3", code, tests)
    assert res["verdict"] == "WRONG_ANSWER"
    assert res["score"] == 0

def test_c_accepted():
    code = """
#include <stdio.h>
int main() {
    int n, a, b;
    if (scanf("%d", &n) != 1) return 0;
    while (n--) {
        scanf("%d %d", &a, &b);
        printf("%d\\n", a + b);
    }
    return 0;
}
"""
    tests = [
        {"id": "1", "type": "public_sample", "input": "2\n5 5\n1 9\n", "output": "10\n10\n", "points": 50}
    ]
    res = evaluate_submission("c", code, tests)
    assert res["verdict"] == "ACCEPTED"
    assert res["score"] == 50

def test_cpp_accepted():
    code = """
#include <iostream>
using namespace std;
int main() {
    int n, a, b;
    if (cin >> n) {
        while (n--) {
            cin >> a >> b;
            cout << (a + b) << "\\n";
        }
    }
    return 0;
}
"""
    tests = [
        {"id": "1", "type": "public_sample", "input": "2\n12 18\n7 8\n", "output": "30\n15\n", "points": 50}
    ]
    res = evaluate_submission("cpp", code, tests)
    assert res["verdict"] == "ACCEPTED"
    assert res["score"] == 50

def test_cpp_compile_error():
    code = """
#include <iostream>
int main() {
    this_is_an_invalid_syntax_error!!
    return 0;
}
"""
    tests = [{"id": "1", "type": "public_sample", "input": "", "output": "", "points": 50}]
    res = evaluate_submission("cpp", code, tests)
    assert res["verdict"] == "COMPILE_ERROR"
    assert "error" in res["compile_log"].lower()

def test_time_limit_exceeded():
    code = """
import time
while True:
    time.sleep(0.5)
"""
    tests = [{"id": "1", "type": "public_sample", "input": "", "output": "ok", "points": 50}]
    res = evaluate_submission("python3", code, tests, time_limit_ms=1000)
    assert res["verdict"] == "TIME_LIMIT_EXCEEDED"

def test_hidden_tests_not_exposed():
    code = "print('wrong')"
    tests = [
        {"id": "h1", "type": "hidden_test", "input": "secret_input", "output": "secret_output", "points": 50}
    ]
    res = evaluate_submission("python3", code, tests, is_sample_run=False)
    assert res["verdict"] == "WRONG_ANSWER"
    # Ensure secret inputs/outputs are never leaked in hidden test results
    assert res["test_results"][0]["actual_output"] == "[HIDDEN]"
    assert "input" not in res["test_results"][0]
    assert "expected_output" not in res["test_results"][0]
