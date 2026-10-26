import pytest
from app.models.schemas import AIRequest
from app.services.algorithmic_solver import generate_algorithmic_solution


def test_algorithmic_solver_count_islands_python():
    req = AIRequest(
        problem_slug="count-islands-with-total-value-divisible-by-k",
        problem_title="Count Islands With Total Value Divisible by K",
        problem_description="Given a grid of integers...",
        language="python",
        stage="generate",
    )
    resp = generate_algorithmic_solution(req)
    assert resp.code is not None
    assert "class Solution:" in resp.code
    assert "def countIslands" in resp.code
    assert resp.model_used is not None


def test_algorithmic_solver_count_islands_cpp():
    req = AIRequest(
        problem_slug="count-islands-with-total-value-divisible-by-k",
        problem_title="Count Islands With Total Value Divisible by K",
        problem_description="Given a grid of integers...",
        language="cpp",
        stage="generate",
    )
    resp = generate_algorithmic_solution(req)
    assert resp.code is not None
    assert "class Solution" in resp.code
    assert "countIslands" in resp.code


def test_algorithmic_solver_stages():
    stages = ["understand", "research", "plan", "validate", "explain"]
    for stg in stages:
        req = AIRequest(
            problem_slug="count-islands-with-total-value-divisible-by-k",
            problem_title="Count Islands With Total Value Divisible by K",
            problem_description="Given a grid of integers...",
            language="python",
            stage=stg,
        )
        resp = generate_algorithmic_solution(req)
        assert resp.content is not None
        assert len(resp.content) > 50
