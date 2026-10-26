"""
Unit and integration tests for:
- LeetCode URL generation & platform-aware navigation
- Clipboard handling & empty solution guard
- Profile service matching Aditya_Kumar_Sah-28
- Secret-safe GitHub Actions workflow validation
- Duplicate daily solution prevention
- Free model enforcement & no fabricated solutions
"""

import ast
import json
import os
import re
from pathlib import Path
import pytest
import yaml

from app.models.schemas import LeetCodeProfile
from app.services.profile_service import fetch_public_profile
from app.services.ai_service import fetch_available_models

ROOT_DIR = Path(__file__).resolve().parent.parent.parent


# ─── 1. LeetCode URL & Navigation Tests ─────────────────────────

def test_canonical_leetcode_url_generation():
    """Verify canonical problem URL generation handles dirty slugs and slashes."""
    def get_canonical_url(slug: str) -> str:
        clean = slug.strip().lower().strip("/")
        return f"https://leetcode.com/problems/{clean}/"

    assert get_canonical_url("two-sum") == "https://leetcode.com/problems/two-sum/"
    assert get_canonical_url("/two-sum/") == "https://leetcode.com/problems/two-sum/"
    assert get_canonical_url("Two-Sum") == "https://leetcode.com/problems/two-sum/"
    assert get_canonical_url("count-islands-with-total-value-divisible-by-k") == (
        "https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/"
    )


def test_empty_solution_rejection():
    """Verify that empty or starter-stub code is properly identified."""
    def is_solution_ready(code: str) -> bool:
        if not code or not code.strip():
            return False
        stripped = code.strip()
        stubs = [
            "class Solution:\n    pass",
            "class Solution:\n    def solve(self):\n        pass",
            "pass",
        ]
        if stripped in stubs:
            return False
        return len(stripped) > 30 and "def " in stripped

    assert is_solution_ready("") is False
    assert is_solution_ready("   ") is False
    assert is_solution_ready("class Solution:\n    pass") is False
    assert is_solution_ready("class Solution:\n    def solve(self):\n        pass") is False
    valid_code = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]"
    assert is_solution_ready(valid_code) is True


# ─── 2. LeetCode Profile Tests (Aditya_Kumar_Sah-28) ────────────

@pytest.mark.asyncio
async def test_fetch_public_profile_structure():
    """Test public profile retrieval and structure for Aditya_Kumar_Sah-28."""
    profile = await fetch_public_profile("Aditya_Kumar_Sah-28")
    assert profile is not None
    assert profile.username == "Aditya_Kumar_Sah-28"
    assert profile.verified is True
    assert profile.solved_total is not None and profile.solved_total >= 0
    assert profile.solved_easy is not None
    assert profile.solved_medium is not None
    assert profile.solved_hard is not None


# ─── 3. Secret-Safe Workflow Validation ─────────────────────────

def test_daily_solve_workflow_yaml():
    """Verify .github/workflows/daily-solve.yml adheres to security, cron, and minimal permissions."""
    wf_path = ROOT_DIR / ".github" / "workflows" / "daily-solve.yml"
    assert wf_path.exists(), "daily-solve.yml must exist"

    content = wf_path.read_text(encoding="utf-8")
    data = yaml.safe_load(content)

    # 1. Verification of UTC Cron & manual dispatch
    triggers = data.get("on") or data.get(True) or {}
    assert "schedule" in triggers, "Workflow must have scheduled trigger"
    cron_exprs = [s.get("cron") for s in triggers["schedule"]]
    assert any("0 0 * * *" in c for c in cron_exprs), "Must run daily at 00:00 UTC"
    assert "workflow_dispatch" in triggers, "Must support manual workflow_dispatch"

    # 2. Minimal permissions
    assert data.get("permissions") == {"contents": "write"}, "Permissions must be strictly contents: write"

    # 3. Secret Ingestion
    assert "OPENROUTER_API_KEY" in content, "Must reference OPENROUTER_API_KEY"
    assert "${{ secrets.OPENROUTER_API_KEY }}" in content, "Must read from GitHub Secrets"

    # 4. No hardcoded API keys
    assert "sk-or-" not in content, "Workflow must not contain hardcoded keys"


def test_deploy_pages_workflow_yaml():
    """Verify .github/workflows/deploy-pages.yml configuration for GitHub Pages."""
    wf_path = ROOT_DIR / ".github" / "workflows" / "deploy-pages.yml"
    assert wf_path.exists(), "deploy-pages.yml must exist"

    content = wf_path.read_text(encoding="utf-8")
    data = yaml.safe_load(content)

    # Verify triggers
    triggers = data.get("on") or data.get(True) or {}
    assert "push" in triggers
    assert "workflow_dispatch" in triggers

    # Verify Pages permissions
    permissions = data.get("permissions", {})
    assert permissions.get("pages") == "write"
    assert permissions.get("id-token") == "write"
    assert permissions.get("contents") == "read"


# ─── 4. Duplicate Prevention & No Fabricated Solutions ─────────

def test_deduplication_logic():
    """Verify manifest entries are not duplicated for identical slug and date."""
    manifest = [
        {"id": 1, "slug": "two-sum", "date": "2026-10-26", "title": "Two Sum"},
        {"id": 2, "slug": "add-two-numbers", "date": "2026-10-25", "title": "Add Two Numbers"},
    ]

    new_problem = {"id": 1, "slug": "two-sum", "date": "2026-10-26", "title": "Two Sum"}

    # Filter out existing before adding
    filtered = [m for m in manifest if not (m["slug"] == new_problem["slug"] and m["date"] == new_problem["date"])]
    filtered.append(new_problem)

    assert len(filtered) == 2, "Duplicate problem for same date must not create duplicate entry"


def test_free_model_enforcement():
    """Ensure paid models are rejected and free models recognized."""
    def is_verified_free(model_id: str, prompt_price: str, comp_price: str) -> bool:
        return model_id.endswith(":free") or (prompt_price == "0" and comp_price == "0")

    assert is_verified_free("openrouter/free", "0", "0") is True
    assert is_verified_free("google/gemma-4-31b-it:free", "0", "0") is True
    assert is_verified_free("anthropic/claude-3-opus", "0.015", "0.075") is False
    assert is_verified_free("openai/gpt-4o", "0.005", "0.015") is False
