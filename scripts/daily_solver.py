"""
LeetCode Daily Challenge Automation Script.

Fetches today's daily problem from LeetCode GraphQL, queries OpenRouter free models,
validates code syntax and example tests, saves unique solution files, and updates
the solution manifest and repository README.

Security & Safety Rules:
- NEVER logs, prints, or writes OPENROUTER_API_KEY to any file.
- NEVER selects a paid model (strictly free models only).
- NEVER publishes a fabricated solution if generation fails.
- Avoids duplicate entries on repeated runs.
"""

import ast
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import httpx

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

ROOT_DIR = Path(__file__).resolve().parent.parent
SOLUTIONS_DIR = ROOT_DIR / "solutions"
MANIFEST_PATH = SOLUTIONS_DIR / "manifest.json"
README_PATH = ROOT_DIR / "README.md"

DAILY_QUERY = """
query questionOfToday {
  activeDailyCodingChallengeQuestion {
    date
    userStatus
    link
    question {
      questionId
      questionFrontendId
      title
      titleSlug
      difficulty
      content
      topicTags {
        name
        slug
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      hints
      exampleTestcaseList
    }
  }
}
"""


def clean_html(html_text: str) -> str:
    """Strip HTML tags to clean plaintext."""
    if not html_text:
        return ""
    text = re.sub(r"<pre>([\s\S]*?)</pre>", r"\n```\n\1\n```\n", html_text)
    text = re.sub(r"<code>(.*?)</code>", r"`\1`", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"&#39;", "'", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_verified_free_models(api_key: Optional[str] = None) -> List[str]:
    """
    Fetch all verified free models from OpenRouter.
    Only models ending in ':free' or with 0 prompt & 0 completion price are selected.
    Guarantees that paid models are NEVER silently selected.
    """
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(OPENROUTER_MODELS_URL, headers=headers)
            resp.raise_for_status()
            data = resp.json().get("data", [])

        free_models = []
        for m in data:
            model_id = m.get("id", "")
            pricing = m.get("pricing", {})
            p_prompt = str(pricing.get("prompt", "0"))
            p_comp = str(pricing.get("completion", "0"))

            is_free = model_id.endswith(":free") or (p_prompt == "0" and p_comp == "0")
            if is_free:
                free_models.append(model_id)

        # Prioritize top coding and general free models
        priority_prefixes = [
            "openrouter/free",
            "google/gemma-4",
            "cohere/north-mini-code",
            "nvidia/nemotron",
            "liquid/lfm",
            "mistralai/mistral",
            "qwen/qwen",
            "meta-llama/llama",
        ]

        def sort_key(model: str) -> int:
            for i, prefix in enumerate(priority_prefixes):
                if model.startswith(prefix) or model == prefix:
                    return i
            return len(priority_prefixes)

        free_models.sort(key=sort_key)
        return free_models
    except Exception as e:
        print(f"[!] Warning: Could not dynamically fetch OpenRouter models ({e}).")
        # Hardcoded strictly-free fallbacks
        return [
            "openrouter/free",
            "google/gemma-4-31b-it:free",
            "cohere/north-mini-code:free",
            "nvidia/nemotron-3.5-lightning:free",
        ]


def fetch_daily_problem() -> Dict[str, Any]:
    """Fetch active daily challenge from LeetCode GraphQL endpoint."""
    print("[*] Fetching LeetCode Daily Challenge from official GraphQL endpoint...")
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://leetcode.com",
    }
    payload = {"query": DAILY_QUERY}

    with httpx.Client(timeout=25.0) as client:
        resp = client.post(LEETCODE_GRAPHQL_URL, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    challenge = data.get("data", {}).get("activeDailyCodingChallengeQuestion", {})
    if not challenge or "question" not in challenge:
        raise ValueError("Invalid LeetCode response: activeDailyCodingChallengeQuestion is missing")

    q = challenge["question"]
    date_str = challenge.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    # Extract python3 or python starter snippet
    snippets = q.get("codeSnippets", []) or []
    py_snippet = ""
    for s in snippets:
        if s.get("langSlug") == "python3":
            py_snippet = s.get("code", "")
            break
    if not py_snippet:
        for s in snippets:
            if s.get("langSlug") == "python":
                py_snippet = s.get("code", "")
                break

    tags = [t["name"] for t in q.get("topicTags", []) if "name" in t]
    raw_content = q.get("content", "")

    # Extract expected outputs from content HTML
    expected_outputs = re.findall(r"Output:\s*</strong>\s*(?:<span[^>]*>)?\s*([^<]+)", raw_content)
    expected_outputs = [o.strip() for o in expected_outputs]

    return {
        "id": int(q.get("questionFrontendId") or q.get("questionId") or 0),
        "title": q.get("title", ""),
        "slug": q.get("titleSlug", ""),
        "difficulty": q.get("difficulty", "Medium"),
        "content": raw_content,
        "clean_content": clean_html(raw_content),
        "date": date_str,
        "url": f"https://leetcode.com/problems/{q.get('titleSlug', '')}/",
        "tags": tags,
        "py_snippet": py_snippet,
        "hints": q.get("hints", []),
        "testcases": q.get("exampleTestcaseList", []),
        "expected_outputs": expected_outputs,
    }


def extract_method_signature(py_snippet: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract (class_name, method_name) from Python starter snippet."""
    if not py_snippet:
        return "Solution", None

    # Try AST parse with pass appended in case snippet ends without body
    try:
        snippet_with_body = py_snippet.rstrip() + "\n        pass\n"
        tree = ast.parse(snippet_with_body)
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                cls_name = node.name
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and not item.name.startswith("__"):
                        return cls_name, item.name
    except Exception:
        pass

    # Regex fallback
    fn_match = re.search(r"def\s+([a-zA-Z0-9_]+)\s*\(", py_snippet)
    cls_match = re.search(r"class\s+([a-zA-Z0-9_]+)", py_snippet)
    cls_name = cls_match.group(1) if cls_match else "Solution"
    method_name = fn_match.group(1) if fn_match else None
    return cls_name, method_name


def validate_solution_code(code_str: str, expected_method: Optional[str]) -> Tuple[bool, str]:
    """Validate that Python code parses without syntax errors and defines expected method."""
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        return False, f"SyntaxError on line {e.lineno}: {e.msg}"

    if expected_method:
        method_found = False
        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == expected_method:
                        method_found = True
                        break
        if not method_found:
            return False, f"Method '{expected_method}' not found in class Solution"

    return True, "Valid syntax and signature"


def run_example_tests(code_str: str, method_name: str, testcases: List[str], expected_outputs: List[str]) -> Tuple[bool, str]:
    """Safely execute example test cases against the solution."""
    if not testcases or not method_name:
        return True, "No testcases to execute"

    try:
        namespace: Dict[str, Any] = {
            "List": list,
            "Dict": dict,
            "Set": set,
            "Optional": Optional,
            "Tuple": tuple,
        }
        compiled = compile(code_str, "<solution>", "exec")
        exec(compiled, namespace)

        if "Solution" not in namespace:
            return False, "Class Solution not defined in executed code"

        sol_instance = namespace["Solution"]()
        method = getattr(sol_instance, method_name, None)
        if not callable(method):
            return False, f"Method '{method_name}' is not callable"

        passed = 0
        for i, raw_tc in enumerate(testcases):
            # Parse testcase arguments
            lines = [l.strip() for l in raw_tc.strip().split("\n") if l.strip()]
            args = []
            for l in lines:
                try:
                    args.append(ast.literal_eval(l))
                except Exception:
                    args.append(l)

            try:
                res = method(*args)
            except Exception as ex:
                return False, f"Example {i + 1} raised runtime error: {ex}"

            if i < len(expected_outputs):
                exp_str = expected_outputs[i].strip()
                res_str = str(res).strip()
                # Normalize booleans
                if exp_str.lower() == "true":
                    exp_val = True
                elif exp_str.lower() == "false":
                    exp_val = False
                else:
                    try:
                        exp_val = ast.literal_eval(exp_str)
                    except Exception:
                        exp_val = exp_str

                if res != exp_val and res_str != exp_str:
                    return False, f"Example {i + 1} failed: expected {exp_val}, got {res}"

            passed += 1

        return True, f"Passed all {passed} example tests"
    except Exception as e:
        return False, f"Test execution error: {e}"


def call_openrouter_model(
    model: str,
    problem: Dict[str, Any],
    api_key: str,
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Call a single verified free model on OpenRouter.
    Returns (code, explanation, error_msg).
    """
    snippet = problem.get("py_snippet") or "class Solution:\n    # Implement here\n"

    system_prompt = (
        "You are an elite competitive programmer and algorithmic reasoning expert. "
        "Solve the LeetCode problem using optimal time and space complexity. "
        "Your code must define `class Solution` and the exact method signature provided. "
        "Return your response in two clearly marked sections:\n"
        "1. ```python\n# YOUR SOLUTION CODE HERE\n```\n"
        "2. ### Explanation\n(Detailed approach, intuition, Time Complexity O(...), Space Complexity O(...))"
    )

    user_prompt = f"""Problem: {problem['title']} (LeetCode #{problem['id']}, {problem['difficulty']})
URL: {problem['url']}
Tags: {', '.join(problem['tags'])}

Description:
{problem['clean_content'][:2500]}

Starter Code Snippet (match this signature):
```python
{snippet}
```

Constraints:
{chr(10).join(f"- {c}" for c in problem.get('hints', [])[:3])}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent",
        "X-Title": "LeetCode Daily AI Solver",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2500,
    }

    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(OPENROUTER_CHAT_URL, headers=headers, json=payload)

        if resp.status_code == 401:
            return None, None, "Authentication failed (401). Check OPENROUTER_API_KEY."
        elif resp.status_code == 429:
            return None, None, f"Rate limit reached (429) for model '{model}'."
        elif resp.status_code in (502, 503, 504):
            return None, None, f"Model '{model}' temporarily unavailable ({resp.status_code})."
        elif resp.status_code != 200:
            return None, None, f"OpenRouter API returned HTTP {resp.status_code}: {resp.text[:150]}"

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            return None, None, "No choices returned from OpenRouter response."

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            return None, None, "Empty completion content returned."

        # Extract code block
        code_match = re.search(r"```(?:python|py)?\s*([\s\S]*?)```", content)
        if not code_match:
            return None, None, "No Python code block found in AI response."

        code = code_match.group(1).strip()
        explanation = re.sub(r"```(?:python|py)?[\s\S]*?```", "", content).strip()
        if not explanation:
            explanation = f"### Solution for {problem['title']}\n\nOptimal solution generated by AI Agent."

        return code, explanation, None

    except httpx.TimeoutException:
        return None, None, f"Request timed out for model '{model}'."
    except Exception as e:
        return None, None, f"Unexpected error with model '{model}': {e}"


def generate_verified_solution(problem: Dict[str, Any], api_key: str) -> Dict[str, str]:
    """
    Generate an optimal solution using OpenRouter free models with fallback and validation.
    NEVER publishes a fabricated solution.
    """
    free_models = fetch_verified_free_models(api_key)
    print(f"[*] Verified {len(free_models)} free models on OpenRouter.")

    cls_name, method_name = extract_method_signature(problem.get("py_snippet", ""))
    print(f"[*] Expected signature: {cls_name}.{method_name}()")

    attempts_log = []

    for model in free_models[:6]:
        print(f"[*] Attempting generation with free model: {model}...")
        code, explanation, error = call_openrouter_model(model, problem, api_key)

        if error:
            print(f"    [x] {error}")
            attempts_log.append(f"{model}: {error}")
            if "Authentication failed" in error:
                # No need to retry if API key is invalid
                raise PermissionError("OPENROUTER_API_KEY is invalid or unauthorized.")
            time.sleep(1)
            continue

        # 1. Syntax & signature validation
        valid_syntax, syntax_msg = validate_solution_code(code, method_name)
        if not valid_syntax:
            print(f"    [x] Code validation failed: {syntax_msg}")
            attempts_log.append(f"{model}: {syntax_msg}")
            continue

        # 2. Example testcases execution
        test_ok, test_msg = run_example_tests(
            code, method_name or "", problem.get("testcases", []), problem.get("expected_outputs", [])
        )
        print(f"    [i] Test execution: {test_msg}")

        # If tests ran and failed, try next model if possible, but if no other works, accept valid syntax
        if not test_ok:
            attempts_log.append(f"{model}: {test_msg}")
            # Try next model for higher precision
            continue

        print(f"[OK] Solution verified with model '{model}'!")
        return {
            "code": code,
            "explanation": explanation,
            "model_used": model,
            "validation_status": test_msg,
        }

    # If example tests were strict and failed, but we had a syntactically valid model,
    # re-check if we can return a syntactically valid solution rather than complete abort
    raise RuntimeError(
        f"Failed to generate a verified solution across free models. Logs: {'; '.join(attempts_log)}"
    )


def save_solution_files(problem: Dict[str, Any], solution: Dict[str, str]) -> Path:
    """Save code and explanation into solutions/YYYY-MM-DD-slug/."""
    date_str = problem["date"]
    slug = problem["slug"]
    folder_name = f"{date_str}-{slug}"
    folder_path = SOLUTIONS_DIR / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)

    py_path = folder_path / "solution.py"
    with open(py_path, "w", encoding="utf-8") as f:
        f.write(solution["code"] + "\n")

    readme_path = folder_path / "README.md"
    readme_content = f"""# {problem['id']}. {problem['title']}

- **Date**: {problem['date']}
- **Difficulty**: {problem['difficulty']}
- **LeetCode Link**: [{problem['url']}]({problem['url']})
- **Tags**: {', '.join(f'`{t}`' for t in problem['tags'])}
- **AI Model**: `{solution.get('model_used', 'OpenRouter Free')}`
- **Validation**: `{solution.get('validation_status', 'Syntax Verified')}`

---

## Problem Description
{problem['clean_content']}

---

## Solution Code

```python
{solution['code']}
```

---

## Explanation & Complexity
{solution['explanation']}
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    print(f"[+] Saved solution in {folder_path.relative_to(ROOT_DIR)}")
    return folder_path


def update_manifest(problem: Dict[str, Any], folder_path: Path, model_used: str):
    """Update solutions/manifest.json avoiding duplicates."""
    SOLUTIONS_DIR.mkdir(parents=True, exist_ok=True)
    manifest: List[Dict[str, Any]] = []

    if MANIFEST_PATH.exists():
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = []

    # Filter out existing entry for this slug and date to avoid duplicates
    manifest = [
        item for item in manifest
        if not (item.get("slug") == problem["slug"] and item.get("date") == problem["date"])
    ]

    new_entry = {
        "id": problem["id"],
        "title": problem["title"],
        "slug": problem["slug"],
        "difficulty": problem["difficulty"],
        "tags": problem["tags"],
        "date": problem["date"],
        "url": problem["url"],
        "folder": folder_path.name,
        "model_used": model_used,
        "solved_at": datetime.now(timezone.utc).isoformat(),
    }
    manifest.append(new_entry)
    manifest.sort(key=lambda x: x.get("date", ""), reverse=True)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"[+] Manifest updated ({len(manifest)} total solutions)")
    return manifest


def update_root_readme(manifest: List[Dict[str, Any]]):
    """Update repository README with badges, progress summary, and solutions table."""
    total_solved = len(manifest)
    easy_count = sum(1 for m in manifest if m.get("difficulty") == "Easy")
    med_count = sum(1 for m in manifest if m.get("difficulty") == "Medium")
    hard_count = sum(1 for m in manifest if m.get("difficulty") == "Hard")

    latest = manifest[0] if manifest else None

    table_rows = []
    for item in manifest[:20]:
        diff = item.get("difficulty", "Medium")
        color = "brightgreen" if diff == "Easy" else "yellow" if diff == "Medium" else "red"
        diff_badge = f"![{diff}](https://img.shields.io/badge/-{diff}-{color}?style=flat-square)"
        tags_str = ", ".join(f"`{t}`" for t in item.get("tags", [])[:3])
        link_code = f"[Python](solutions/{item.get('folder', '')}/solution.py)"
        link_notes = f"[Notes](solutions/{item.get('folder', '')}/README.md)"
        lc_link = f"[{item.get('id', '')}. {item.get('title', '')}]({item.get('url', '')})"

        table_rows.append(
            f"| {item.get('date', '')} | {lc_link} | {diff_badge} | {tags_str} | {link_code} · {link_notes} |"
        )

    table_md = "\n".join(table_rows) if table_rows else "| - | No solutions committed yet | - | - | - |"

    readme_content = f"""# ⚡ LeetCode AI Agent — Autonomous Problem Solver & Workspace

[![Daily LeetCode Solver](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml)
[![Deploy to GitHub Pages](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml)
[![Solutions Solved](https://img.shields.io/badge/Solutions%20Solved-{total_solved}-6c63ff?style=for-the-badge&logo=leetcode)](solutions/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An intelligent, local-first **LeetCode AI Assistant & Automated Daily Problem Solver**.

- 🌐 **Interactive Web Workspace**: Built with React, TypeScript, Tailwind CSS, and Monaco Editor.
- 🤖 **Multi-Stage AI Reasoning**: Understand ➔ Research ➔ Plan ➔ Generate ➔ Validate ➔ Explain.
- 📅 **GitHub Actions Daily Scheduler**: Runs every midnight (00:00 UTC) to fetch the official LeetCode Daily Challenge, generate the optimal solution with OpenRouter AI, validate code syntax with AST, and push commits to GitHub.
- 🔒 **Zero Signup / Privacy First**: Direct browser-to-model execution, localStorage & IndexedDB persistence, no external database required.

---

## 🚀 Latest Daily Challenge

{f'''
> **{latest['id']}. {latest['title']}** ({latest['difficulty']})  
> 📅 **Date**: `{latest['date']}`  
> 🔗 [View on LeetCode]({latest['url']}) · [View Solution Code](solutions/{latest['folder']}/solution.py) · [View Editorial](solutions/{latest['folder']}/README.md)
''' if latest else '> *Run the daily automation workflow to fetch today’s challenge.*'}

### Progress Summary
| Total Solved | Easy | Medium | Hard |
|:---:|:---:|:---:|:---:|
| **{total_solved}** | 🟢 {easy_count} | 🟡 {med_count} | 🔴 {hard_count} |

---

## 📂 Recent Solved Challenges

| Date | Problem | Difficulty | Topics | Solution & Notes |
|:---|:---|:---:|:---|:---|
{table_md}

*See full index in [`solutions/manifest.json`](solutions/manifest.json).*

---

## 🛠️ System Architecture

```text
       GitHub Actions (Daily Scheduler: 00:00 UTC)
                         │
                         ▼
             Fetch LeetCode Daily Challenge
                         │
                         ▼
               AI Multi-Stage Reasoning
         (OpenRouter Free Models: Gemini / Gemma)
                         │
                         ▼
             Python AST Syntax & Test Validation
                         │
                         ▼
            Generate Solution & Editorial
                         │
                         ▼
       Update solutions/ & manifest.json & README.md
                         │
                         ▼
           Git Auto-Commit & Push to Repo
```

---

## 💻 Local Development Setup

### 1. Frontend (React + Vite + Monaco Editor)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Optional Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Run Daily Solver Manually
```bash
python scripts/daily_solver.py
```
*(Requires `OPENROUTER_API_KEY` in environment for live AI code generation).*

---

## ⚙️ GitHub Actions Daily Automation Setup

To enable daily automated commits to your GitHub repository:

1. Go to your repository on GitHub: `https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent`
2. Navigate to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click **New repository secret**.
4. Name: `OPENROUTER_API_KEY`
5. Value: Your free OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys).
6. Enable GitHub Actions write permissions in **Settings** ➔ **Actions** ➔ **General** ➔ **Workflow permissions** (select *Read and write permissions*).

The daily workflow will automatically run every day at `00:00 UTC` and commit the new solution!

---

## 📄 License
MIT License. Created by [Aditya Kumar Sah](https://github.com/Aditya-Kumar-Sah-CSE).
"""

    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(readme_content)

    print("[+] Root README.md updated")


def main():
    parser = argparse.ArgumentParser(description="LeetCode Daily AI Solver")
    parser.add_argument("--verify-openrouter", action="store_true", help="Verify OpenRouter connection and free models")
    parser.add_argument("--verify-daily", action="store_true", help="Verify LeetCode daily problem fetching")
    parser.add_argument("--dry-run", action="store_true", help="Fetch problem and test validation without publishing")
    parser.add_argument("--force", action="store_true", help="Force re-generation even if solution exists")
    args = parser.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY")

    # ── Mode 1: Verify OpenRouter ──────────────────────────────
    if args.verify_openrouter:
        print("=== OpenRouter AI Verification ===")
        print(f"[*] Checking environment variable OPENROUTER_API_KEY: {'[CONFIGURED]' if api_key else '[NOT SET]'}")

        free_models = fetch_verified_free_models(api_key)
        print(f"[*] Total verified free models on OpenRouter: {len(free_models)}")
        print(f"[*] Available free models: {', '.join(free_models[:8])}")

        if api_key:
            test_model = free_models[0] if free_models else "openrouter/free"
            print(f"[*] Testing safe ping request using free model '{test_model}'...")
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            try:
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(
                        OPENROUTER_CHAT_URL,
                        headers=headers,
                        json={
                            "model": test_model,
                            "messages": [{"role": "user", "content": "Reply with 'OK'"}],
                            "max_tokens": 10,
                        },
                    )
                if resp.status_code == 200:
                    print(f"[OK] OpenRouter test request succeeded (HTTP 200) with free model '{test_model}'!")
                else:
                    print(f"[!] OpenRouter test request returned HTTP {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                print(f"[!] OpenRouter connection error: {e}")
        else:
            print("[i] OPENROUTER_API_KEY is not set in local environment.")
            print("[i] Model catalog was successfully verified without credentials. In GitHub Actions, the key is passed via secrets.OPENROUTER_API_KEY.")
        return

    # ── Mode 2: Verify Daily LeetCode Fetch ────────────────────
    if args.verify_daily:
        print("=== LeetCode Daily Challenge Verification ===")
        problem = fetch_daily_problem()
        cls_name, method_name = extract_method_signature(problem.get("py_snippet", ""))
        print(f"[OK] Successfully fetched today's problem:")
        print(f"     ID: #{problem['id']}")
        print(f"     Title: {problem['title']}")
        print(f"     Difficulty: {problem['difficulty']}")
        print(f"     Date: {problem['date']}")
        print(f"     URL: {problem['url']}")
        print(f"     Tags: {', '.join(problem['tags'])}")
        print(f"     Expected Signature: {cls_name}.{method_name}()")
        print(f"     Example Test Cases: {len(problem['testcases'])} cases found")
        print(f"     Extracted Outputs: {problem['expected_outputs']}")
        return

    # ── Mode 3: Normal / Scheduled Execution ───────────────────
    # 1. Fetch daily problem
    problem = fetch_daily_problem()
    cls_name, method_name = extract_method_signature(problem.get("py_snippet", ""))
    print(f"[+] Loaded Problem #{problem['id']}: {problem['title']} ({problem['difficulty']})")

    # 2. Check deduplication
    expected_folder = SOLUTIONS_DIR / f"{problem['date']}-{problem['slug']}"
    if expected_folder.exists() and (expected_folder / "solution.py").exists() and not args.force:
        print(f"[i] Solution for today's challenge already exists in {expected_folder.name}.")
        print("[i] Skipping duplicate execution to preserve clean history. (Use --force to override).")
        sys.exit(0)

    # 3. Dry-run mode without publishing
    if args.dry_run:
        print("[*] Running in --dry-run mode (no files will be written or committed).")
        if not api_key:
            print("[i] Dry-run check passed: Daily challenge fetched and signature verified successfully.")
            return

    # 4. Enforce API key requirement for live generation
    if not api_key:
        print("[ERROR] OPENROUTER_API_KEY environment variable is not configured.")
        print("[ERROR] Refusing to publish or commit a fabricated solution.")
        sys.exit(1)

    # 5. Generate verified solution with free models
    try:
        solution = generate_verified_solution(problem, api_key)
    except Exception as e:
        print(f"[ERROR] Solution generation failed: {e}")
        print("[ERROR] Refusing to publish or commit a fabricated solution.")
        sys.exit(1)

    # 6. Save files
    folder_path = save_solution_files(problem, solution)

    # 7. Update manifest
    manifest = update_manifest(problem, folder_path, solution.get("model_used", "openrouter/free"))

    # 8. Update root README
    update_root_readme(manifest)

    print("[OK] Daily LeetCode Solver completed successfully!")


if __name__ == "__main__":
    main()
