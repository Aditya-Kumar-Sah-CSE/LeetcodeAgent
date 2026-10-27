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
    fetch_contests,
    fetch_contest_questions,
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
from app.services.chat_service import save_chat_history, get_chat_history
from app.services.execution_service import execute_code
from app.models.schemas import (
    AIRequest,
    SaveSolutionRequest,
    SaveChatRequest,
    RunCodeRequest,
    RunCodeResponse,
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

@router.get("/problem/resolve")
async def resolve_problem_url(url: str = Query(..., description="Full LeetCode URL or slug")):
    """Resolve and fetch any problem directly from a full LeetCode problem or contest URL."""
    try:
        problem = await fetch_problem_by_slug(url)
        return problem
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch problem from LeetCode: {str(e)}")


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
    username: Optional[str] = Query(None, description="LeetCode username to mark solved problems"),
):
    """Fetch practice problems filtered by difficulty, topic, and mark solved for connected account."""
    try:
        data = await fetch_practice_problems(
            difficulty=difficulty,
            topic=topic,
            limit=limit,
            skip=skip,
            search=search,
            username=username,
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


# ─── Code Execution ─────────────────────────────────────────────

@router.post("/code/run", response_model=RunCodeResponse)
async def run_code_endpoint(request: RunCodeRequest):
    """Execute code against problem test cases."""
    try:
        response = await execute_code(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution error: {str(e)}")



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


# ─── Live & Virtual Contests ──────────────────────────────────

@router.get("/contests")
async def get_contests(limit: int = Query(1000, ge=1, le=1000)):
    """Fetch live, upcoming, and past virtual contests."""
    try:
        contests = await fetch_contests(limit=limit)
        return contests
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch contests: {str(e)}")


@router.get("/contests/{contest_slug}/questions")
async def get_contest_questions(
    contest_slug: str,
    username: Optional[str] = Query(None),
):
    """Fetch the questions of a specific contest."""
    try:
        questions = await fetch_contest_questions(contest_slug, username=username)
        return questions
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch contest questions: {str(e)}")


# ─── AI Assistant Chat Session Persistence & GitHub Sync ──────

@router.get("/chat/{slug}")
async def get_chat(slug: str):
    """Retrieve saved chat history for a problem slug."""
    chat = get_chat_history(slug)
    if not chat:
        raise HTTPException(status_code=404, detail=f"No saved chat history found for '{slug}'")
    return chat


@router.post("/chat/{slug}")
async def save_chat(slug: str, request: SaveChatRequest):
    """Save chat session to solutions directory as JSON and Markdown, with optional git push."""
    try:
        messages_data = [m.model_dump() for m in request.messages]
        result = save_chat_history(
            slug=slug,
            messages=messages_data,
            problem_title=request.problem_title,
            push_to_git=request.push_to_git,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chat history: {str(e)}")


@router.post("/chat/{slug}/push-github")
async def push_chat_github(slug: str, request: SaveChatRequest):
    """Save chat history and commit + push to GitHub repository."""
    try:
        messages_data = [m.model_dump() for m in request.messages]
        result = save_chat_history(
            slug=slug,
            messages=messages_data,
            problem_title=request.problem_title,
            push_to_git=True,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to push chat to GitHub: {str(e)}")
