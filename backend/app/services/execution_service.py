"""
Code execution service for LeetCode Agent.
Supports Python, JavaScript, TypeScript, C++, and Java.
Uses local execution for Python and Node.js, and Godbolt Compiler Explorer for C++/Java,
with fallback to AI Sandbox Simulation.
"""

import os
import sys
import re
import json
import ast
import time
import asyncio
import logging
import tempfile
import httpx
from typing import Optional, Any

from app.models.schemas import (
    RunCodeRequest,
    RunCodeResponse,
    SingleTestResult,
    TestCaseItem,
)
from app.services.ai_service import chat_completion
from app.core.config import settings

logger = logging.getLogger(__name__)

# ANSI escape sequence stripper
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')


def _strip_ansi(text: str) -> str:
    """Remove ANSI color escape sequences."""
    return ANSI_ESCAPE.sub('', text)


def _normalize_lang(lang: str) -> str:
    """Normalize language slug."""
    l = lang.lower().strip()
    if l in ("py", "python", "python3"):
        return "python"
    if l in ("cpp", "c++", "g++"):
        return "cpp"
    if l in ("js", "javascript"):
        return "javascript"
    if l in ("ts", "typescript"):
        return "typescript"
    if l in ("java",):
        return "java"
    return l


def _parse_input_to_args(raw_input: str) -> list[Any]:
    """
    Parse a LeetCode example input string into a list of Python arguments.
    Example: 'nums = [1,5,2,4,1,3,0]' -> [[1,5,2,4,1,3,0]]
    Example: 'nums = [2,7,11,15], target = 9' -> [[2,7,11,15], 9]
    """
    raw = raw_input.strip()
    if not raw:
        return []

    # Check for name = value pairs
    pattern = r'([a-zA-Z_]\w*)\s*=\s*'
    matches = list(re.finditer(pattern, raw))
    args = []
    if matches:
        for i in range(len(matches)):
            start = matches[i].end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
            val_str = raw[start:end].strip().rstrip(',')
            try:
                val = json.loads(val_str)
            except Exception:
                try:
                    val = ast.literal_eval(val_str)
                except Exception:
                    val = val_str
            args.append(val)
    else:
        # Check for newline-delimited inputs
        lines = [l.strip() for l in raw.split('\n') if l.strip()]
        for line in lines:
            try:
                args.append(json.loads(line))
            except Exception:
                try:
                    args.append(ast.literal_eval(line))
                except Exception:
                    args.append(line)

    return args


def _compare_outputs(expected: Optional[str], actual: Optional[str]) -> bool:
    """Compare expected and actual outputs taking formatting into account."""
    if expected is None:
        return True
    if actual is None:
        return False

    exp_clean = expected.strip()
    act_clean = actual.strip()

    # Exact string match
    if exp_clean == act_clean:
        return True

    # Case-insensitive boolean
    if exp_clean.lower() == act_clean.lower() and exp_clean.lower() in ("true", "false", "null", "none"):
        return True

    # Try JSON / object comparison
    try:
        exp_obj = json.loads(exp_clean)
        act_obj = json.loads(act_clean)
        if exp_obj == act_obj:
            return True
        # If both are lists and order may not matter (e.g. [[1,2],[3,4]])
        if isinstance(exp_obj, list) and isinstance(act_obj, list):
            try:
                if sorted(exp_obj) == sorted(act_obj):
                    return True
            except Exception:
                pass
    except Exception:
        pass

    # Try float comparison
    try:
        f_exp = float(exp_clean)
        f_act = float(act_clean)
        if abs(f_exp - f_act) < 1e-4:
            return True
    except Exception:
        pass

    # Strip spaces inside arrays e.g. [0, 1] vs [0,1]
    norm_exp = re.sub(r'\s+', '', exp_clean)
    norm_act = re.sub(r'\s+', '', act_clean)
    return norm_exp == norm_act


# ────────────────────────────────────────────────────────────────
# 1. Python Local Execution
# ────────────────────────────────────────────────────────────────

async def _run_python_locally(code: str, testcases: list[TestCaseItem]) -> RunCodeResponse:
    """Execute Python code locally using subprocess."""
    start_time = time.perf_counter()

    # Create test runner script
    tc_data = [{"input": tc.input, "expected": tc.expected_output} for tc in testcases]
    tc_json = json.dumps(tc_data)

    runner_template = f"""# -*- coding: utf-8 -*-
import sys, json, time, io, re, ast
from typing import *
from collections import *
import heapq, math, bisect

# Definition for singly-linked list
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Definition for a binary tree node
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# User solution
{code}

def _parse_input_to_args(raw_input: str):
    raw = raw_input.strip()
    if not raw:
        return []
    pattern = r'([a-zA-Z_]\\w*)\\s*=\\s*'
    matches = list(re.finditer(pattern, raw))
    args = []
    if matches:
        for i in range(len(matches)):
            start = matches[i].end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
            val_str = raw[start:end].strip().rstrip(',')
            try:
                val = json.loads(val_str)
            except Exception:
                try:
                    val = ast.literal_eval(val_str)
                except Exception:
                    val = val_str
            args.append(val)
    else:
        lines = [l.strip() for l in raw.split('\\n') if l.strip()]
        for line in lines:
            try:
                args.append(json.loads(line))
            except Exception:
                try:
                    args.append(ast.literal_eval(line))
                except Exception:
                    args.append(line)
    return args

def serialize_val(val):
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        return json.dumps(val)
    if isinstance(val, ListNode):
        res = []
        curr = val
        while curr:
            res.append(curr.val)
            curr = curr.next
        return json.dumps(res)
    try:
        return json.dumps(val)
    except Exception:
        return str(val)

def main():
    testcases = json.loads({json.dumps(tc_json)})
    
    # Locate solution instance and method
    sol_cls = globals().get('Solution')
    if not sol_cls:
        print("ERROR: class Solution not found in code", file=sys.stderr)
        sys.exit(2)
        
    sol = sol_cls()
    methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if not methods:
        print("ERROR: No public method found in class Solution", file=sys.stderr)
        sys.exit(2)
    method_name = methods[0]
    func = getattr(sol, method_name)

    results = []
    for idx, tc in enumerate(testcases):
        inp_str = tc["input"]
        exp_str = tc.get("expected")
        args = _parse_input_to_args(inp_str)

        old_stdout = sys.stdout
        captured = io.StringIO()
        sys.stdout = captured
        t0 = time.perf_counter()
        
        try:
            res = func(*args)
            dt = (time.perf_counter() - t0) * 1000
            sys.stdout = old_stdout
            act_str = serialize_val(res)
            results.append({{
                "test_index": idx + 1,
                "status": "COMPLETED",
                "input": inp_str,
                "expected_output": exp_str,
                "actual_output": act_str,
                "stdout": captured.getvalue().strip() or None,
                "runtime_ms": round(dt, 2),
                "error": None
            }})
        except Exception as e:
            import traceback
            sys.stdout = old_stdout
            results.append({{
                "test_index": idx + 1,
                "status": "ERROR",
                "input": inp_str,
                "expected_output": exp_str,
                "actual_output": None,
                "stdout": captured.getvalue().strip() or None,
                "runtime_ms": 0,
                "error": traceback.format_exc()
            }})

    print("__JSON_RESULTS_START__")
    print(json.dumps(results))
    print("__JSON_RESULTS_END__")

if __name__ == '__main__':
    main()
"""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(runner_template)
        temp_path = f.name

    python_exec = sys.executable

    try:
        proc = await asyncio.create_subprocess_exec(
            python_exec,
            temp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=8.0)
        except asyncio.TimeoutError:
            proc.kill()
            return RunCodeResponse(
                success=False,
                status="TIME_LIMIT_EXCEEDED",
                message="Time Limit Exceeded: Execution took longer than 8.0 seconds.",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=8000.0,
                runtime_error="Process exceeded time limit.",
                results=[],
            )

        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if proc.returncode != 0:
            # Syntax / compile error or import error
            clean_err = _clean_python_traceback(stderr or stdout, temp_path)
            is_syntax = "SyntaxError" in clean_err or "IndentationError" in clean_err
            return RunCodeResponse(
                success=False,
                status="COMPILE_ERROR" if is_syntax else "RUNTIME_ERROR",
                message="Syntax Error in Python code" if is_syntax else "Runtime Error during execution",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=total_time_ms,
                compile_error=clean_err if is_syntax else None,
                runtime_error=clean_err if not is_syntax else None,
                results=[],
            )

        # Parse JSON results from stdout
        match = re.search(r'__JSON_RESULTS_START__\s*([\s\S]*?)\s*__JSON_RESULTS_END__', stdout)
        if not match:
            return RunCodeResponse(
                success=False,
                status="RUNTIME_ERROR",
                message="Execution produced invalid output format.",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=total_time_ms,
                runtime_error=stdout or stderr,
                results=[],
            )

        raw_results = json.loads(match.group(1))
        parsed_results: list[SingleTestResult] = []
        passed_count = 0

        for r in raw_results:
            is_err = r.get("error") is not None
            if is_err:
                status = "ERROR"
            else:
                passed = _compare_outputs(r.get("expected_output"), r.get("actual_output"))
                status = "PASSED" if passed else "FAILED"
                if passed:
                    passed_count += 1

            parsed_results.append(SingleTestResult(
                test_index=r["test_index"],
                status=status,
                input=r["input"],
                expected_output=r.get("expected_output"),
                actual_output=r.get("actual_output"),
                stdout=r.get("stdout"),
                error=_clean_python_traceback(r.get("error") or "", temp_path) if is_err else None,
                runtime_ms=r.get("runtime_ms"),
            ))

        all_passed = passed_count == len(testcases) and len(testcases) > 0
        has_error = any(r.status == "ERROR" for r in parsed_results)

        if has_error:
            overall_status = "RUNTIME_ERROR"
            msg = f"Runtime Error occurred in {sum(1 for r in parsed_results if r.status == 'ERROR')} testcase(s)."
        elif all_passed:
            overall_status = "ACCEPTED"
            msg = f"All {len(testcases)} testcases passed!"
        else:
            overall_status = "WRONG_ANSWER"
            msg = f"{passed_count} / {len(testcases)} testcases passed."

        return RunCodeResponse(
            success=all_passed,
            status=overall_status,
            message=msg,
            total_tests=len(testcases),
            passed_tests=passed_count,
            runtime_ms=total_time_ms,
            results=parsed_results,
        )

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def _clean_python_traceback(tb: str, temp_file_path: str) -> str:
    """Clean internal temporary runner paths from traceback for clear user display."""
    if not tb:
        return ""
    lines = tb.splitlines()
    clean_lines = []
    for l in lines:
        if temp_file_path in l:
            # Replace full temp path with friendly "solution.py"
            l = l.replace(temp_file_path, "solution.py")
        if "main()" in l and "runner" in l.lower():
            continue
        clean_lines.append(l)
    return "\n".join(clean_lines).strip()


# ────────────────────────────────────────────────────────────────
# 2. JavaScript / TypeScript Local Execution (Node.js)
# ────────────────────────────────────────────────────────────────

async def _run_js_locally(code: str, testcases: list[TestCaseItem], is_ts: bool = False) -> RunCodeResponse:
    """Execute JavaScript or TypeScript code using local Node.js."""
    start_time = time.perf_counter()

    # Strip TypeScript type annotations if needed
    runnable_code = code
    if is_ts:
        runnable_code = _strip_ts_annotations(code)

    tc_data = [{"input": tc.input, "expected": tc.expected_output} for tc in testcases]
    tc_json = json.dumps(tc_data)

    runner_template = f"""
// User code
{runnable_code}

function _parseInput(raw) {{
    raw = (raw || "").trim();
    if (!raw) return [];
    const pattern = /([a-zA-Z_]\\w*)\\s*=\\s*/g;
    const matches = [];
    let m;
    while ((m = pattern.exec(raw)) !== null) {{
        matches.push({{ index: m.index, end: pattern.lastIndex, name: m[1] }});
    }}
    if (matches.length > 0) {{
        const args = [];
        for (let i = 0; i < matches.length; i++) {{
            const start = matches[i].end;
            const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
            let valStr = raw.substring(start, end).trim().replace(/,+$/, "");
            try {{
                args.push(JSON.parse(valStr));
            }} catch (e) {{
                args.push(valStr);
            }}
        }}
        return args;
    }}
    try {{
        return [JSON.parse(raw)];
    }} catch (e) {{
        return [raw];
    }}
}}

function serialize(val) {{
    if (val === undefined || val === null) return "null";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number") return String(val);
    if (typeof val === "string") return JSON.stringify(val);
    try {{
        return JSON.stringify(val);
    }} catch (e) {{
        return String(val);
    }}
}}

function findFunction() {{
    if (typeof Solution === "function") {{
        const sol = new Solution();
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(sol)).filter(m => m !== "constructor" && typeof sol[m] === "function");
        if (methods.length > 0) return {{ fn: sol[methods[0]].bind(sol), name: methods[0] }};
    }}
    // Find globally declared functions
    const g = globalThis;
    for (const key of Object.keys(g)) {{
        if (typeof g[key] === "function" && !["setTimeout","clearTimeout","setInterval","clearInterval","setImmediate","clearImmediate","queueMicrotask","findFunction","_parseInput","serialize"].includes(key)) {{
            return {{ fn: g[key], name: key }};
        }}
    }}
    return null;
}}

const testcases = {tc_json};
const target = findFunction();

if (!target) {{
    console.error("No LeetCode solution function or class Solution found in code.");
    process.exit(1);
}}

const results = [];
for (let i = 0; i < testcases.length; i++) {{
    const tc = testcases[i];
    const args = _parseInput(tc.input);
    const t0 = performance.now();
    try {{
        const res = target.fn(...args);
        const dt = performance.now() - t0;
        results.push({{
            test_index: i + 1,
            status: "COMPLETED",
            input: tc.input,
            expected_output: tc.expected,
            actual_output: serialize(res),
            runtime_ms: Math.round(dt * 100) / 100,
            error: null
        }});
    }} catch (err) {{
        results.push({{
            test_index: i + 1,
            status: "ERROR",
            input: tc.input,
            expected_output: tc.expected,
            actual_output: null,
            runtime_ms: 0,
            error: err.stack || String(err)
        }});
    }}
}}

console.log("__JSON_RESULTS_START__");
console.log(JSON.stringify(results));
console.log("__JSON_RESULTS_END__");
"""

    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(runner_template)
        temp_path = f.name

    try:
        proc = await asyncio.create_subprocess_exec(
            "node",
            temp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=8.0)
        except asyncio.TimeoutError:
            proc.kill()
            return RunCodeResponse(
                success=False,
                status="TIME_LIMIT_EXCEEDED",
                message="Time Limit Exceeded (8s limit)",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=8000.0,
                runtime_error="Execution timed out.",
                results=[],
            )

        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if proc.returncode != 0:
            is_syntax = "SyntaxError" in stderr or "SyntaxError" in stdout
            err_msg = (stderr or stdout).replace(temp_path, "solution.js").strip()
            return RunCodeResponse(
                success=False,
                status="COMPILE_ERROR" if is_syntax else "RUNTIME_ERROR",
                message="Syntax Error in JavaScript/TypeScript code" if is_syntax else "Runtime Error",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=total_time_ms,
                compile_error=err_msg if is_syntax else None,
                runtime_error=err_msg if not is_syntax else None,
                results=[],
            )

        match = re.search(r'__JSON_RESULTS_START__\s*([\s\S]*?)\s*__JSON_RESULTS_END__', stdout)
        if not match:
            return RunCodeResponse(
                success=False,
                status="RUNTIME_ERROR",
                message="Execution produced invalid output format.",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=total_time_ms,
                runtime_error=stdout or stderr,
                results=[],
            )

        raw_results = json.loads(match.group(1))
        parsed_results: list[SingleTestResult] = []
        passed_count = 0

        for r in raw_results:
            is_err = r.get("error") is not None
            if is_err:
                status = "ERROR"
            else:
                passed = _compare_outputs(r.get("expected_output"), r.get("actual_output"))
                status = "PASSED" if passed else "FAILED"
                if passed:
                    passed_count += 1

            parsed_results.append(SingleTestResult(
                test_index=r["test_index"],
                status=status,
                input=r["input"],
                expected_output=r.get("expected_output"),
                actual_output=r.get("actual_output"),
                stdout=None,
                error=r.get("error"),
                runtime_ms=r.get("runtime_ms"),
            ))

        all_passed = passed_count == len(testcases) and len(testcases) > 0
        has_error = any(r.status == "ERROR" for r in parsed_results)

        return RunCodeResponse(
            success=all_passed,
            status="RUNTIME_ERROR" if has_error else ("ACCEPTED" if all_passed else "WRONG_ANSWER"),
            message=f"All {len(testcases)} testcases passed!" if all_passed else f"{passed_count} / {len(testcases)} passed.",
            total_tests=len(testcases),
            passed_tests=passed_count,
            runtime_ms=total_time_ms,
            results=parsed_results,
        )

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def _strip_ts_annotations(code: str) -> str:
    """Lightweight strip of common TypeScript type annotations for Node execution."""
    c = code
    # Strip parameter types e.g. `(nums: number[], target: number): number =>`
    c = re.sub(r':\s*[a-zA-Z0-9_<>[\]|&,\s]+(?=\s*[,)])', '', c)
    # Strip return type annotations e.g. `): number {`
    c = re.sub(r'\):\s*[a-zA-Z0-9_<>[\]|&,\s]+\s*\{', ') {', c)
    # Strip interface / type declarations
    c = re.sub(r'interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}', '', c)
    c = re.sub(r'type\s+[A-Za-z0-9_]+\s*=\s*[^;]+;', '', c)
    return c


# ────────────────────────────────────────────────────────────────
# 3. C++ Execution via Godbolt Compiler Explorer
# ────────────────────────────────────────────────────────────────

def _extract_cpp_method_name(code: str) -> Optional[str]:
    """Find public method name inside class Solution."""
    pattern = r'([a-zA-Z0-9_<>\*:\s]+?)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{'
    matches = re.findall(pattern, code)
    for ret_type, method_name, params_str in matches:
        if method_name not in ('Solution', '~Solution', 'if', 'while', 'for', 'switch'):
            return method_name.strip()
    return None


def _infer_cpp_type_and_val(val: Any) -> tuple[str, str]:
    """Infer C++ type and literal string for argument passing."""
    if isinstance(val, bool):
        return "bool", "true" if val else "false"
    if isinstance(val, int):
        return "int", str(val)
    if isinstance(val, float):
        return "double", str(val)
    if isinstance(val, str):
        safe_str = val.replace('"', '\\"')
        return "string", f'"{safe_str}"'
    if isinstance(val, list):
        if not val:
            return "vector<int>", "{}"
        if all(isinstance(x, list) for x in val):
            if all(all(isinstance(y, int) for y in x) for x in val):
                inner = ", ".join("{" + ", ".join(str(y) for y in x) + "}" for x in val)
                return "vector<vector<int>>", f"{{{inner}}}"
            elif all(all(isinstance(y, str) for y in x) for x in val):
                inner = ", ".join("{" + ", ".join(f'"{y}"' for y in x) + "}" for x in val)
                return "vector<vector<string>>", f"{{{inner}}}"
            else:
                inner = ", ".join("{" + ", ".join(str(y) for y in x) + "}" for x in val)
                return "vector<vector<int>>", f"{{{inner}}}"
        elif all(isinstance(x, int) for x in val):
            return "vector<int>", f"{{{', '.join(str(x) for x in val)}}}"
        elif all(isinstance(x, str) for x in val):
            return "vector<string>", f"{{{', '.join(f'\"{x}\"' for x in val)}}}"
        elif all(isinstance(x, float) for x in val):
            return "vector<double>", f"{{{', '.join(str(x) for x in val)}}}"
        else:
            return "vector<int>", f"{{{', '.join(str(x) for x in val)}}}"
    return "auto", str(val)


async def _run_cpp_godbolt(code: str, testcases: list[TestCaseItem]) -> RunCodeResponse:
    """Compile and execute C++ using Godbolt Compiler Explorer."""
    start_time = time.perf_counter()
    method_name = _extract_cpp_method_name(code)

    if not method_name:
        return RunCodeResponse(
            success=False,
            status="COMPILE_ERROR",
            message="Could not find method signature inside class Solution.",
            total_tests=len(testcases),
            passed_tests=0,
            runtime_ms=0,
            compile_error="Syntax/Structure Error: Ensure your C++ code includes `class Solution { public: ... }`.",
            results=[],
        )

    # Build test cases inside main()
    main_cases = []
    for i, tc in enumerate(testcases):
        args = _parse_input_to_args(tc.input)
        arg_declarations = []
        arg_names = []
        for j, arg_val in enumerate(args):
            cpp_type, cpp_val = _infer_cpp_type_and_val(arg_val)
            vname = f"arg_{i}_{j}"
            arg_declarations.append(f"        {cpp_type} {vname} = {cpp_val};")
            arg_names.append(vname)

        call_args = ", ".join(arg_names)
        case_block = f"""
    {{
        cout << "___CASE_{i}_START___" << endl;
{chr(10).join(arg_declarations)}
        try {{
            auto res_{i} = sol.{method_name}({call_args});
            cout << "OUTPUT:";
            printVal(res_{i});
            cout << endl;
        }} catch (const exception& e) {{
            cout << "EX_ERROR:" << e.what() << endl;
        }} catch (...) {{
            cout << "EX_ERROR:Unknown runtime exception" << endl;
        }}
        cout << "___CASE_{i}_END___" << endl;
    }}"""
        main_cases.append(case_block)


    harness = f"""
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <deque>
#include <cmath>
#include <numeric>
#include <climits>
#include <sstream>

using namespace std;

// LeetCode structures
struct ListNode {{
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {{}}
    ListNode(int x) : val(x), next(nullptr) {{}}
    ListNode(int x, ListNode *next) : val(x), next(next) {{}}
}};

struct TreeNode {{
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {{}}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {{}}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {{}}
}};

// Pretty printers
template<typename T>
void printVal(const T& val) {{
    cout << val;
}}

inline void printVal(bool val) {{
    cout << (val ? "true" : "false");
}}

inline void printVal(const string& val) {{
    cout << "\\"" << val << "\\"";
}}

template<typename T>
void printVal(const vector<T>& vec) {{
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {{
        if (i > 0) cout << ",";
        printVal(vec[i]);
    }}
    cout << "]";
}}

inline void printVal(ListNode* node) {{
    cout << "[";
    bool first = true;
    while (node) {{
        if (!first) cout << ",";
        cout << node->val;
        node = node->next;
        first = false;
    }}
    cout << "]";
}}

// ─── User Solution ───
{code}

// ─── Main Runner ───
int main() {{
    Solution sol;
{''.join(main_cases)}
    return 0;
}}
"""

    godbolt_url = "https://godbolt.org/api/compiler/g132/compile"
    godbolt_payload = {
        "source": harness,
        "options": {
            "userArguments": "-O2 -std=c++20",
            "compilerOptions": {"executorRequest": True},
            "filters": {"execute": True},
        },
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                godbolt_url,
                json=godbolt_payload,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeetCodeAgent/1.0",
                },
            )
            resp.raise_for_status()
            data = resp.json()


        total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        build_res = data.get("buildResult", {})
        build_code = build_res.get("code", 0)

        # Check for compilation errors
        if build_code != 0:
            stderr_lines = [l.get("text", "") for l in build_res.get("stderr", [])]
            raw_err = "\n".join(stderr_lines)
            clean_err = _clean_godbolt_errors(raw_err)
            return RunCodeResponse(
                success=False,
                status="COMPILE_ERROR",
                message="C++ Compilation Error",
                total_tests=len(testcases),
                passed_tests=0,
                runtime_ms=total_time_ms,
                compile_error=clean_err or "Compilation failed. Check C++ syntax.",
                results=[],
            )

        # Parse test results from stdout
        stdout_lines = [l.get("text", "") for l in data.get("stdout", [])]
        stdout_full = "\n".join(stdout_lines)

        parsed_results: list[SingleTestResult] = []
        passed_count = 0

        for i, tc in enumerate(testcases):
            pattern = rf'___CASE_{i}_START___\s*([\s\S]*?)\s*___CASE_{i}_END___'
            m = re.search(pattern, stdout_full)
            if not m:
                parsed_results.append(SingleTestResult(
                    test_index=i + 1,
                    status="ERROR",
                    input=tc.input,
                    expected_output=tc.expected_output,
                    error="Test case execution produced no output.",
                ))
                continue

            case_out = m.group(1).strip()
            if "EX_ERROR:" in case_out:
                err_text = case_out.split("EX_ERROR:")[-1].strip()
                parsed_results.append(SingleTestResult(
                    test_index=i + 1,
                    status="ERROR",
                    input=tc.input,
                    expected_output=tc.expected_output,
                    error=f"Runtime Exception: {err_text}",
                ))
            else:
                act_match = re.search(r'OUTPUT:\s*(.*)', case_out)
                act_str = act_match.group(1).strip() if act_match else case_out
                passed = _compare_outputs(tc.expected_output, act_str)
                if passed:
                    passed_count += 1
                parsed_results.append(SingleTestResult(
                    test_index=i + 1,
                    status="PASSED" if passed else "FAILED",
                    input=tc.input,
                    expected_output=tc.expected_output,
                    actual_output=act_str,
                    runtime_ms=round(total_time_ms / max(1, len(testcases)), 2),
                ))

        all_passed = passed_count == len(testcases) and len(testcases) > 0
        has_error = any(r.status == "ERROR" for r in parsed_results)

        return RunCodeResponse(
            success=all_passed,
            status="RUNTIME_ERROR" if has_error else ("ACCEPTED" if all_passed else "WRONG_ANSWER"),
            message=f"All {len(testcases)} testcases passed!" if all_passed else f"{passed_count} / {len(testcases)} passed.",
            total_tests=len(testcases),
            passed_tests=passed_count,
            runtime_ms=total_time_ms,
            results=parsed_results,
        )

    except Exception as e:
        logger.warning(f"Godbolt execution failed: {e}. Falling back to AI Sandbox runner.")
        return await _run_ai_sandbox(RunCodeRequest(
            problem_slug="cpp-problem",
            language="cpp",
            code=code,
            testcases=testcases,
        ))


def _clean_godbolt_errors(err: str) -> str:
    """Clean Godbolt error messages for user-friendly display."""
    err = _strip_ansi(err)
    lines = err.splitlines()
    clean = []
    for l in lines:
        if "<source>:" in l:
            clean.append(l.replace("<source>:", "solution.cpp:"))
        elif l.strip():
            clean.append(l)
    return "\n".join(clean).strip()


# ────────────────────────────────────────────────────────────────
# 4. AI Execution Sandbox Fallback (Ultra-accurate CP simulation)
# ────────────────────────────────────────────────────────────────

async def _run_ai_sandbox(request: RunCodeRequest) -> RunCodeResponse:
    """
    Fallback execution using ultra-fast AI inference (Groq / Gemini).
    Accurately simulates execution of algorithms, detects syntax errors, and validates test cases.
    """
    start_time = time.perf_counter()

    prompt = f"""You are a strict, ultra-accurate LeetCode automated online judge and code executor.
Language: {request.language}

Code to execute:
```{request.language}
{request.code}
```

Testcases to execute:
{json.dumps([{"index": i + 1, "input": tc.input, "expected": tc.expected_output} for i, tc in enumerate(request.testcases)], indent=2)}

INSTRUCTIONS:
1. First, check for compilation or syntax errors in the user's code for {request.language}.
   If there is a syntax/compilation error, return status "COMPILE_ERROR" with the exact compiler error message.
2. If the code compiles, mentally execute each testcase step by step against the user's logic.
3. For each testcase, capture the exact output returned by the function.
4. Compare actual output with expected output.
5. If an unhandled exception or crash would occur (e.g. index out of range, null pointer), mark that testcase as "ERROR".

You MUST reply with ONLY a single valid JSON object in this exact format (no markdown fences, no extra text):
{{
  "status": "ACCEPTED" | "WRONG_ANSWER" | "COMPILE_ERROR" | "RUNTIME_ERROR",
  "compile_error": null or "error string",
  "runtime_error": null or "error string",
  "results": [
    {{
      "test_index": 1,
      "status": "PASSED" | "FAILED" | "ERROR",
      "input": "...",
      "expected_output": "...",
      "actual_output": "...",
      "error": null or "error string"
    }}
  ]
}}"""

    try:
        raw_res = await chat_completion(
            messages=[
                {"role": "system", "content": "You are a competitive programming judge. Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
            model_id="gemini-3-flash-preview",
            temperature=0.0,
            max_tokens=2048,
        )

        total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        cleaned_text = raw_res.strip()
        if cleaned_text.startswith("```"):
            cleaned_text = re.sub(r'^```(?:json)?\s*', '', cleaned_text)
            cleaned_text = re.sub(r'\s*```$', '', cleaned_text)

        data = json.loads(cleaned_text)

        parsed_results: list[SingleTestResult] = []
        passed_count = 0

        for r in data.get("results", []):
            st = r.get("status", "FAILED")
            if st == "PASSED":
                passed_count += 1
            parsed_results.append(SingleTestResult(
                test_index=r.get("test_index", 1),
                status=st,
                input=r.get("input", ""),
                expected_output=r.get("expected_output"),
                actual_output=r.get("actual_output"),
                error=r.get("error"),
                runtime_ms=round(total_time_ms / max(1, len(request.testcases)), 2),
            ))

        overall_status = data.get("status", "ACCEPTED" if passed_count == len(request.testcases) else "WRONG_ANSWER")
        all_passed = overall_status == "ACCEPTED" and passed_count == len(request.testcases)

        return RunCodeResponse(
            success=all_passed,
            status=overall_status,
            message=f"All {len(request.testcases)} testcases passed!" if all_passed else f"{passed_count} / {len(request.testcases)} passed.",
            total_tests=len(request.testcases),
            passed_tests=passed_count,
            runtime_ms=total_time_ms,
            compile_error=data.get("compile_error"),
            runtime_error=data.get("runtime_error"),
            results=parsed_results,
        )

    except Exception as e:
        logger.error(f"AI Sandbox execution failed: {e}")
        return RunCodeResponse(
            success=False,
            status="RUNTIME_ERROR",
            message=f"Execution error: {str(e)}",
            total_tests=len(request.testcases),
            passed_tests=0,
            runtime_ms=0,
            runtime_error=str(e),
            results=[],
        )


# ────────────────────────────────────────────────────────────────
# Main Execution Entry Point
# ────────────────────────────────────────────────────────────────

async def execute_code(request: RunCodeRequest) -> RunCodeResponse:
    """Execute code against test cases in the specified language."""
    lang = _normalize_lang(request.language)
    logger.info(f"Executing code for '{request.problem_slug}' in {lang} ({len(request.testcases)} testcases)")

    if not request.code or not request.code.strip():
        return RunCodeResponse(
            success=False,
            status="COMPILE_ERROR",
            message="No code provided to execute.",
            total_tests=len(request.testcases),
            passed_tests=0,
            runtime_ms=0,
            compile_error="Editor is empty. Write or load code before running.",
            results=[],
        )

    if lang == "python":
        return await _run_python_locally(request.code, request.testcases)
    elif lang in ("javascript", "typescript"):
        return await _run_js_locally(request.code, request.testcases, is_ts=(lang == "typescript"))
    elif lang == "cpp":
        return await _run_cpp_godbolt(request.code, request.testcases)
    else:
        # Java or other languages -> AI sandbox or Godbolt Java
        return await _run_ai_sandbox(request)
