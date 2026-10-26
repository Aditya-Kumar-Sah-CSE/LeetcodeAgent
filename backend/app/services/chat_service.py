"""
Chat session management service.
Handles saving, retrieving, and committing AI assistant chat histories to solutions directory and git.
"""

import json
import logging
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_solutions_dir() -> Path:
    """Get the solutions directory, checking repo root first then fallback."""
    repo_solutions = Path(__file__).resolve().parent.parent.parent.parent / "solutions"
    if repo_solutions.exists():
        return repo_solutions

    solutions_dir = Path(settings.SOLUTIONS_DIR).resolve()
    solutions_dir.mkdir(parents=True, exist_ok=True)
    return solutions_dir


def _find_or_create_problem_folder(slug: str) -> Path:
    """Find existing folder for problem slug or create a dedicated one."""
    solutions_dir = _get_solutions_dir()

    # Look for existing subdirectories containing this slug (e.g. YYYY-MM-DD-slug or slug)
    for subdir in solutions_dir.iterdir():
        if subdir.is_dir() and (slug in subdir.name):
            return subdir

    # If not found, create new folder solutions/<slug>
    folder = solutions_dir / slug
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def format_markdown_chat_log(slug: str, problem_title: str, messages: List[Dict[str, Any]]) -> str:
    """Generate a clean, readable Markdown chat transcript for GitHub documentation."""
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = [
        f"# AI Assistant Conversation: {problem_title or slug}",
        f"> **Problem**: `{slug}`  ",
        f"> **Last Updated**: {now_str}  ",
        f"> **Total Messages**: {len(messages)}  ",
        "",
        "---",
        "",
        "## Chat Transcript",
        "",
    ]

    for idx, msg in enumerate(messages, 1):
        role = msg.get("role", "user").capitalize()
        content = msg.get("content", "").strip()
        reasoning = msg.get("reasoning", "").strip()
        tool_calls = msg.get("tool_calls", [])
        ts = msg.get("timestamp")
        time_hint = ""
        if ts:
            try:
                dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
                time_hint = f" *({dt.strftime('%H:%M:%S')})*"
            except Exception:
                pass

        if role == "User":
            lines.append(f"### 👤 User{time_hint}")
            lines.append(content)
            lines.append("")
        else:
            lines.append(f"### 🤖 AI Assistant{time_hint}")

            if reasoning or tool_calls:
                lines.append("<details>")
                lines.append("<summary><b>🧠 Agent Reasoning & Tool Calls</b></summary>\n")
                if reasoning:
                    lines.append(f"**Thought Process:**\n```\n{reasoning}\n```\n")
                if tool_calls:
                    lines.append("**Tools Executed:**")
                    for tc in tool_calls:
                        tname = tc.get("name", "tool")
                        tlabel = tc.get("label", tname)
                        tresult = tc.get("result", "")
                        lines.append(f"- `🛠️ {tlabel}`: {tresult}")
                    lines.append("")
                lines.append("</details>\n")

            lines.append(content)
            lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def save_chat_history(
    slug: str,
    messages: List[Dict[str, Any]],
    problem_title: Optional[str] = None,
    push_to_git: bool = False,
) -> Dict[str, Any]:
    """Save chat history to solutions directory as JSON and formatted Markdown."""
    folder = _find_or_create_problem_folder(slug)
    json_path = folder / "chat_history.json"
    md_path = folder / "CHAT_LOG.md"

    now_iso = datetime.now(timezone.utc).isoformat()
    chat_payload = {
        "slug": slug,
        "problem_title": problem_title or slug.replace("-", " ").title(),
        "updated_at": now_iso,
        "messages": messages,
    }

    # Write JSON history
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(chat_payload, f, indent=2, ensure_ascii=False)

    # Write Markdown transcript
    md_content = format_markdown_chat_log(slug, problem_title or slug, messages)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    git_committed = False
    git_pushed = False
    git_message = "Saved locally in solutions repository"

    if push_to_git:
        try:
            repo_root = Path(__file__).resolve().parent.parent.parent.parent
            # Stage the files
            subprocess.run(
                ["git", "add", str(json_path), str(md_path)],
                cwd=repo_root,
                capture_output=True,
                text=True,
                check=False,
            )

            # Check if there are staged changes
            diff_res = subprocess.run(
                ["git", "diff", "--staged", "--quiet"],
                cwd=repo_root,
                capture_output=True,
                check=False,
            )
            has_changes = diff_res.returncode != 0

            if has_changes:
                commit_msg = f"chore(chat): update AI assistant conversation for {slug} [skip ci]"
                commit_res = subprocess.run(
                    ["git", "commit", "-m", commit_msg],
                    cwd=repo_root,
                    capture_output=True,
                    text=True,
                    check=False,
                )
                if commit_res.returncode == 0:
                    git_committed = True
                    # Push to origin
                    push_res = subprocess.run(
                        ["git", "push", "origin", "main"],
                        cwd=repo_root,
                        capture_output=True,
                        text=True,
                        timeout=15,
                        check=False,
                    )
                    if push_res.returncode == 0:
                        git_pushed = True
                        git_message = "Successfully committed and pushed to GitHub main branch!"
                    else:
                        git_message = f"Committed locally, remote push notice: {push_res.stderr.strip() or 'Token/auth check required'}"
                else:
                    git_message = f"Git commit failed: {commit_res.stderr.strip()}"
            else:
                git_message = "No new changes to commit (already up-to-date)."
        except Exception as e:
            logger.warning("Git operation exception: %s", e)
            git_message = f"Git operation notice: {str(e)}"

    return {
        "status": "ok",
        "slug": slug,
        "folder": folder.name,
        "count": len(messages),
        "json_path": str(json_path),
        "md_path": str(md_path),
        "git_committed": git_committed,
        "git_pushed": git_pushed,
        "message": git_message,
    }


def get_chat_history(slug: str) -> Optional[Dict[str, Any]]:
    """Retrieve saved chat history for a problem slug."""
    solutions_dir = _get_solutions_dir()

    # Search in matching subdirectories
    for subdir in solutions_dir.iterdir():
        if subdir.is_dir() and (slug in subdir.name):
            chat_file = subdir / "chat_history.json"
            if chat_file.exists():
                try:
                    with open(chat_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    logger.warning("Error reading %s: %s", chat_file, e)

    # Check direct slug folder
    direct_file = solutions_dir / slug / "chat_history.json"
    if direct_file.exists():
        try:
            with open(direct_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning("Error reading %s: %s", direct_file, e)

    return None
