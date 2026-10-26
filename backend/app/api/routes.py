"""
API routes for the LeetCode AI Agent backend.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.leetcode_service import (
    fetch_daily_challenge,
    fetch_problem_by_slug,
    fetch_code_snippets,
    clear_daily_cache,
    fetch_topic_tags,
    fetch_practice_problems,
)
from app.services.ai_service import fetch_available_models
from app.services.search_service import search_web
from app.services.solution_service import (
    save_solution,
    get_solution,
    list_solutions,
    delete_solution,
    solution_exists,
)
from app.services.profile_service import fetch_public_profile
from app.agents.coding_agent import run_agent_stage
from app.models.schemas import (
    AIRequest,
    SaveSolutionRequest,
)

router = APIRouter()


# ─── Health ─────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "leetcode-ai-agent"}


# ─── Daily Challenge ────────────────────────────────────────────

@router.get("/daily")
async def get_daily_challenge():
    """Fetch today's LeetCode daily challenge."""
    try:
        problem = await fetch_daily_challenge()
        return problem
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch daily challenge: {str(e)}")


@router.post("/daily/refresh")
async def refresh_daily_challenge():
    """Force refresh the daily challenge cache."""
    clear_daily_cache()
    try:
        problem = await fetch_daily_challenge()
        return problem
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to refresh daily challenge: {str(e)}")


# ─── Problem Details ────────────────────────────────────────────

@router.get("/problem/{slug}")
async def get_problem(slug: str):
    """Fetch a specific problem by slug."""
    try:
        problem = await fetch_problem_by_slug(slug)
        return problem
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch problem: {str(e)}")


@router.get("/problem/{slug}/snippets")
async def get_problem_snippets(slug: str):
    """Get code snippets (function signatures) for a problem."""
    try:
        snippets = await fetch_code_snippets(slug)
        return snippets
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch snippets: {str(e)}")


# ─── Practice Problems & Topics ────────────────────────────────

@router.get("/topics")
async def get_topics():
    """Fetch official LeetCode DSA topics."""
    try:
        topics = await fetch_topic_tags()
        return {"topics": [t.model_dump() for t in topics]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch DSA topics: {str(e)}")


@router.get("/problems")
async def get_practice_problems(
    difficulty: Optional[str] = Query(None, description="Easy, Medium, Hard"),
    topic: Optional[str] = Query(None, description="Topic slug e.g. array, depth-first-search"),
    limit: int = Query(20, ge=1, le=50),
    skip: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Keywords to search in title or slug"),
):
    """Fetch practice problems filtered by difficulty and DSA topic from LeetCode."""
    try:
        data = await fetch_practice_problems(
            difficulty=difficulty,
            topic=topic,
            limit=limit,
            skip=skip,
            search=search,
        )
        return data.model_dump()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch practice problems: {str(e)}")


# ─── AI Models ──────────────────────────────────────────────────

@router.get("/models")
async def get_models(api_key: Optional[str] = Query(None)):
    """Get available AI models from OpenRouter."""
    try:
        models = await fetch_available_models(api_key)
        return {"models": [m.model_dump() for m in models]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch models: {str(e)}")


# ─── AI Agent ───────────────────────────────────────────────────

@router.post("/agent/run")
async def run_agent(request: AIRequest):
    """Run a stage of the AI coding agent."""
    response = await run_agent_stage(request)
    if response.error and not response.content:
        raise HTTPException(status_code=500, detail=response.error)
    return response


# ─── Web Search ─────────────────────────────────────────────────

@router.get("/search")
async def web_search(q: str = Query(..., min_length=1), max_results: int = Query(5, ge=1, le=10)):
    """Search the web for algorithm information."""
    response = await search_web(q, max_results)
    return response


# ─── Solutions ──────────────────────────────────────────────────

@router.get("/solutions")
async def get_solutions():
    """List all saved solutions."""
    solutions = list_solutions()
    return {"solutions": [s.model_dump() for s in solutions]}


@router.post("/solutions")
async def create_solution(request: SaveSolutionRequest):
    """Save a solution file."""
    solution = save_solution(request)
    return solution


@router.get("/solutions/{slug}")
async def get_solution_file(slug: str, language: str = Query("python")):
    """Get a specific solution file."""
    solution = get_solution(slug, language)
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")
    return solution


@router.delete("/solutions/{slug}")
async def delete_solution_file(slug: str, language: str = Query("python")):
    """Delete a solution file."""
    deleted = delete_solution(slug, language)
    if not deleted:
        raise HTTPException(status_code=404, detail="Solution not found")
    return {"deleted": True}


@router.get("/solutions/{slug}/exists")
async def check_solution_exists(slug: str, language: str = Query("python")):
    """Check if a solution file already exists."""
    exists = solution_exists(slug, language)
    return {"exists": exists}


# ─── Profile ───────────────────────────────────────────────────

@router.get("/profile/{username}")
async def get_profile(username: str):
    """Fetch a public LeetCode profile."""
    profile = await fetch_public_profile(username)
    if not profile:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found on LeetCode")
    return profile
