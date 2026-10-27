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
    tier: Optional[str] = "medium"  # "low" | "medium" | "high" | "local"
    specification: Optional[str] = None
    speed: Optional[str] = None
    reasoning_power: Optional[str] = None
    required_key: Optional[str] = "openrouter"  # "gemini" | "groq" | "openrouter" | "none"
    required_key_name: Optional[str] = "OpenRouter API Key"
    key_url: Optional[str] = "https://openrouter.ai/keys"
    pricing_type: Optional[str] = "Free Tier"
    token_limit: Optional[str] = None
    best_for: Optional[str] = None


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


# ─── Chat Assistant Models ────────────────────────────────────

class ToolCallItem(BaseModel):
    """Tool invocation item displayed in agent reasoning trace."""
    name: str
    label: str
    status: str = "completed"
    args: Optional[dict] = None
    result: Optional[str] = None


class ChatMessageModel(BaseModel):
    """A chat message in a conversation session."""
    model_config = {"protected_namespaces": ()}

    id: str
    role: str  # "user" | "assistant" | "system"
    content: str
    reasoning: Optional[str] = None
    tool_calls: Optional[list[ToolCallItem]] = None
    timestamp: int
    model_used: Optional[str] = None


class SaveChatRequest(BaseModel):
    """Request to persist or git-push chat session."""
    slug: str
    problem_title: Optional[str] = None
    messages: list[ChatMessageModel]
    push_to_git: bool = False


# ─── Code Execution Models ────────────────────────────────────

class TestCaseItem(BaseModel):
    """A test case input with expected output."""
    input: str
    expected_output: Optional[str] = None


class RunCodeRequest(BaseModel):
    """Request to execute code against test cases."""
    problem_slug: str
    problem_title: Optional[str] = None
    language: str = "python"
    code: str
    testcases: list[TestCaseItem] = []


class SingleTestResult(BaseModel):
    """Result for an individual test case."""
    test_index: int
    status: str  # "PASSED", "FAILED", "ERROR"
    input: str
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    stdout: Optional[str] = None
    error: Optional[str] = None
    runtime_ms: Optional[float] = None


class RunCodeResponse(BaseModel):
    """Overall execution response."""
    success: bool
    status: str  # "ACCEPTED", "WRONG_ANSWER", "COMPILE_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED"
    message: str
    total_tests: int
    passed_tests: int
    runtime_ms: float
    compile_error: Optional[str] = None
    runtime_error: Optional[str] = None
    results: list[SingleTestResult] = []

