"""
Pydantic models for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── LeetCode Models ───────────────────────────────────────────

class ProblemExample(BaseModel):
    """A single example from a LeetCode problem."""
    input: str
    output: str
    explanation: Optional[str] = None


class DailyProblem(BaseModel):
    """The LeetCode daily challenge problem."""
    id: int
    title: str
    slug: str
    difficulty: str  # Easy, Medium, Hard
    description: str  # HTML content
    examples: list[ProblemExample] = []
    constraints: list[str] = []
    tags: list[str] = []
    url: str
    date: str  # YYYY-MM-DD
    fetched_at: str  # ISO timestamp
    code_snippets: dict[str, str] = {}
    is_solved: Optional[bool] = None


class ProblemBrief(BaseModel):
    """Brief problem info for lists."""
    id: int
    title: str
    slug: str
    difficulty: str
    tags: list[str] = []
    url: str
    is_solved: Optional[bool] = None


class TopicTag(BaseModel):
    """LeetCode DSA topic tag."""
    name: str
    slug: str


class ProblemListResponse(BaseModel):
    """Response containing practice problem set and total count."""
    total: int
    questions: list[ProblemBrief]


# ─── Contest Models ───────────────────────────────────────────

class ContestBrief(BaseModel):
    """Brief contest information."""
    title: str
    slug: str
    start_time: int
    duration: int
    origin_start_time: int
    is_virtual: bool
    status: str  # "UPCOMING" | "LIVE" | "PAST"
    url: str


class ContestQuestion(BaseModel):
    """A contest question."""
    id: str
    title: str
    slug: str
    credit: int
    difficulty: str  # "Easy" | "Medium" | "Hard"
    url: str
    is_solved: Optional[bool] = None


class ContestDetail(BaseModel):
    """Detailed contest info with questions."""
    title: str
    slug: str
    start_time: int
    duration: int
    status: str
    url: str
    questions: list[ContestQuestion] = []


# ─── AI Models ─────────────────────────────────────────────────

class AIModel(BaseModel):
    """An available AI model from OpenRouter."""
    id: str
    name: str
    provider: str = ""
    context_length: Optional[int] = None
    is_free: bool = False
    description: Optional[str] = None


class AIRequest(BaseModel):
    """Request to the AI agent."""
    problem_slug: str
    problem_title: str
    problem_description: str
    examples: list[ProblemExample] = []
    constraints: list[str] = []
    language: str = "python"
    stage: str = "generate"  # understand, research, plan, generate, validate, explain
    api_key: Optional[str] = None  # User-provided key (not stored)
    model_id: Optional[str] = None
    previous_context: Optional[str] = None


class AIResponse(BaseModel):
    """Response from the AI agent."""
    stage: str
    content: str
    code: Optional[str] = None
    model_used: str = ""
    citations: list[dict] = []
    error: Optional[str] = None


# ─── Search Models ─────────────────────────────────────────────

class SearchResult(BaseModel):
    """A single web search result."""
    title: str
    url: str
    snippet: str


class SearchResponse(BaseModel):
    """Web search response."""
    query: str
    results: list[SearchResult] = []
    error: Optional[str] = None


# ─── Solution Models ───────────────────────────────────────────

class SolutionFile(BaseModel):
    """A solution file with optional book metadata."""
    problem_slug: str
    problem_title: str
    language: str
    filename: str
    code: str
    created_at: str
    updated_at: str
    id: Optional[int] = None
    difficulty: Optional[str] = None
    tags: Optional[list[str]] = None
    date: Optional[str] = None
    url: Optional[str] = None
    concept: Optional[str] = None
    trick_english: Optional[str] = None
    trick_hinglish: Optional[str] = None
    summary_english: Optional[str] = None
    summary_hinglish: Optional[str] = None
    topics_needed: Optional[list[str]] = None
    stages_summary: Optional[list[dict]] = None
    folder: Optional[str] = None



class SaveSolutionRequest(BaseModel):
    """Request to save a solution file."""
    problem_slug: str
    problem_title: str
    language: str
    code: str


# ─── Profile Models ───────────────────────────────────────────

class LeetCodeProfile(BaseModel):
    """Public LeetCode profile data."""
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    ranking: Optional[int] = None
    solved_total: Optional[int] = None
    solved_easy: Optional[int] = None
    solved_medium: Optional[int] = None
    solved_hard: Optional[int] = None
    reputation: Optional[int] = None
    verified: bool = False
    solved_slugs: list[str] = []
