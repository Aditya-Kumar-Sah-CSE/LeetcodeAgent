"""
AI Coding Agent pipeline.
Implements the 7-stage agent: understand → research → plan → generate → validate → explain → prepare.
"""

import logging
import re
from typing import Optional

from app.services.ai_service import chat_completion
from app.services.search_service import search_web
from app.services.algorithmic_solver import generate_algorithmic_solution
from app.models.schemas import AIRequest, AIResponse, SearchResult

logger = logging.getLogger(__name__)

# Language-specific templates for function signatures
LANGUAGE_TEMPLATES = {
    "python": "Python 3",
    "python3": "Python 3",
    "cpp": "C++",
    "c++": "C++",
    "java": "Java",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
}


def _build_system_prompt(language: str) -> str:
    """Build the system prompt for the AI agent."""
    lang_name = LANGUAGE_TEMPLATES.get(language.lower(), language)
    return f"""You are an expert competitive programming assistant. You help solve LeetCode problems.

RULES:
1. Write clean, efficient, well-commented {lang_name} code.
2. Always preserve the EXACT function signature required by LeetCode.
3. For Python: use `class Solution` with the exact method signature.
4. For C++: use `class Solution` with the exact method signature.
5. For Java: use `class Solution` with the exact method signature.
6. For JavaScript/TypeScript: use the exact function signature provided.
7. Include necessary imports at the top.
8. Explain your approach clearly.
9. Analyze time and space complexity.
10. Consider edge cases.
11. Do NOT generate standalone programs - only the solution class/function.
12. When providing code, wrap it in ```{language.lower()} code blocks."""


def _build_understand_prompt(request: AIRequest) -> list[dict]:
    """Build prompt for the Understand stage."""
    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Analyze this LeetCode problem:

**{request.problem_title}**

{request.problem_description}

**Examples:**
{_format_examples(request)}

**Constraints:**
{_format_constraints(request)}

Please:
1. Identify the input/output formats
2. Extract key constraints
3. Identify potential edge cases
4. Determine the required function signature
5. Classify the problem type (array, string, tree, graph, DP, etc.)

Provide a structured analysis."""}
    ]


def _build_research_prompt(request: AIRequest, search_results: list[SearchResult]) -> list[dict]:
    """Build prompt for the Research stage with web search citations."""
    citations = ""
    if search_results:
        citations = "\n\n**Research findings:**\n"
        for i, r in enumerate(search_results, 1):
            citations += f"\n[{i}] {r.title}\n    URL: {r.url}\n    {r.snippet}\n"

    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Research approaches for this problem:

**{request.problem_title}**

{request.problem_description}
{citations}

Based on the problem and any research findings above:
1. What algorithm patterns apply? (Two pointers, sliding window, BFS/DFS, DP, etc.)
2. What data structures would be useful?
3. Are there known optimal approaches for this problem type?
4. What are the key insights needed?

Cite sources where applicable using [n] notation. Provide a structured research summary."""}
    ]


def _build_plan_prompt(request: AIRequest) -> list[dict]:
    """Build prompt for the Plan stage."""
    context = request.previous_context or ""
    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Plan a solution for this problem:

**{request.problem_title}**

{request.problem_description}

{f"Previous analysis: {context}" if context else ""}

Create a detailed plan:
1. Chosen algorithm and WHY it's optimal
2. Step-by-step approach
3. Expected time complexity
4. Expected space complexity
5. Tricky cases to handle
6. Pseudocode outline"""}
    ]


def _build_generate_prompt(request: AIRequest) -> list[dict]:
    """Build prompt for the Generate stage."""
    lang_name = LANGUAGE_TEMPLATES.get(request.language.lower(), request.language)
    context = request.previous_context or ""
    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Generate a complete {lang_name} solution for:

**{request.problem_title}**

{request.problem_description}

**Examples:**
{_format_examples(request)}

{f"Plan: {context}" if context else ""}

Requirements:
- Use the EXACT LeetCode function signature
- Include the Solution class (for Python/C++/Java)
- Include necessary imports
- Write clean, readable code with comments
- Handle all edge cases from the constraints

Generate ONLY the solution code. Wrap it in a ```{request.language.lower()} code block."""}
    ]


def _build_validate_prompt(request: AIRequest) -> list[dict]:
    """Build prompt for the Validate stage."""
    context = request.previous_context or ""
    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Validate this solution:

**{request.problem_title}**

{request.problem_description}

**Examples:**
{_format_examples(request)}

**Solution code:**
{context}

Please validate:
1. Does the function signature match LeetCode's requirements?
2. Are all imports present?
3. Walk through each example - does the code produce the correct output?
4. Generate 2-3 additional edge case inputs and expected outputs
5. Check for off-by-one errors, null/empty inputs, boundary conditions
6. Is the time/space complexity optimal?

Be HONEST. If there are bugs, point them out. Do NOT claim tests pass unless you've verified them."""}
    ]


def _build_explain_prompt(request: AIRequest) -> list[dict]:
    """Build prompt for the Explain stage."""
    context = request.previous_context or ""
    return [
        {"role": "system", "content": _build_system_prompt(request.language)},
        {"role": "user", "content": f"""Explain this solution in simple terms:

**{request.problem_title}**

**Solution:**
{context}

Provide:
1. A plain-language explanation of the algorithm
2. Why this approach works
3. Key lines of code explained
4. Time complexity with reasoning
5. Space complexity with reasoning
6. A dry run walkthrough with Example 1"""}
    ]


def _format_examples(request: AIRequest) -> str:
    """Format examples for the prompt."""
    if not request.examples:
        return "(No examples provided)"
    parts = []
    for i, ex in enumerate(request.examples, 1):
        part = f"Example {i}:\n  Input: {ex.input}\n  Output: {ex.output}"
        if ex.explanation:
            part += f"\n  Explanation: {ex.explanation}"
        parts.append(part)
    return "\n".join(parts)


def _format_constraints(request: AIRequest) -> str:
    """Format constraints for the prompt."""
    if not request.constraints:
        return "(No constraints provided)"
    return "\n".join(f"- {c}" for c in request.constraints)


def _extract_code(response_text: str, language: str) -> Optional[str]:
    """Extract code from a markdown code block in the AI response."""
    # Try language-specific code block first
    patterns = [
        rf'```{re.escape(language.lower())}\s*\n(.*?)```',
        rf'```{re.escape(LANGUAGE_TEMPLATES.get(language.lower(), language).lower())}\s*\n(.*?)```',
        r'```(?:python3?|cpp|c\+\+|java|javascript|typescript|js|ts)\s*\n(.*?)```',
        r'```\s*\n(.*?)```',
    ]

    for pattern in patterns:
        match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()

    return None


# Stage dispatch
STAGE_BUILDERS = {
    "understand": _build_understand_prompt,
    "plan": _build_plan_prompt,
    "generate": _build_generate_prompt,
    "validate": _build_validate_prompt,
    "explain": _build_explain_prompt,
}


async def run_agent_stage(request: AIRequest) -> AIResponse:
    """Run a single stage of the AI coding agent with seamless algorithmic fallback."""
    stage = request.stage
    logger.info("Running agent stage: %s for problem: %s", stage, request.problem_slug)

    from app.core.config import settings
    has_key = bool(request.api_key or settings.OPENROUTER_API_KEY)
    if not has_key:
        logger.info("No OpenRouter API key found; using Autonomous Algorithmic Engine.")
        return generate_algorithmic_solution(request)

    try:
        # Special handling for research stage (includes web search)
        if stage == "research":
            return await _run_research_stage(request)

        # Build prompt for the stage
        builder = STAGE_BUILDERS.get(stage)
        if not builder:
            return generate_algorithmic_solution(request)

        messages = builder(request)

        # Call AI
        model_id = request.model_id or "openrouter/free"
        response_text = await chat_completion(
            messages=messages,
            model_id=model_id,
            api_key=request.api_key,
        )

        # Extract code if this is a generation stage
        code = None
        if stage == "generate":
            code = _extract_code(response_text, request.language)
            if not code:
                # Fallback guarantee: use algorithmic engine's generated code
                algo_res = generate_algorithmic_solution(request)
                code = algo_res.code

        return AIResponse(
            stage=stage,
            content=response_text,
            code=code,
            model_used=model_id,
        )

    except Exception as e:
        logger.warning("Agent stage '%s' LLM call failed (%s); falling back to Algorithmic Engine.", stage, str(e))
        fallback = generate_algorithmic_solution(request)
        fallback.content = f"{fallback.content}\n\n*(Auto-resolved via Algorithmic Engine — LLM notice: {str(e)})*"
        return fallback


async def _run_research_stage(request: AIRequest) -> AIResponse:
    """Run the research stage with web search and graceful fallback."""
    try:
        search_query = f"{request.problem_title} leetcode algorithm approach"
        search_response = await search_web(search_query)

        citations = []
        search_results = search_response.results
        if search_results:
            citations = [
                {"title": r.title, "url": r.url, "snippet": r.snippet}
                for r in search_results
            ]

        messages = _build_research_prompt(request, search_results)

        model_id = request.model_id or "openrouter/free"
        response_text = await chat_completion(
            messages=messages,
            model_id=model_id,
            api_key=request.api_key,
        )

        return AIResponse(
            stage="research",
            content=response_text,
            model_used=model_id,
            citations=citations,
        )
    except Exception as e:
        logger.warning("Research stage LLM failed: %s; using algorithmic fallback.", str(e))
        return generate_algorithmic_solution(request)
