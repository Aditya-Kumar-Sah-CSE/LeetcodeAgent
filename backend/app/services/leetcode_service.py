"""
LeetCode Daily Challenge fetcher using LeetCode's public GraphQL endpoint.
"""

import httpx
import logging
from datetime import datetime, timezone
from typing import Optional
import re
import html

from app.models.schemas import DailyProblem, ProblemExample
from app.core.config import settings

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# Query to get the daily challenge question
DAILY_CHALLENGE_QUERY = """
query questionOfToday {
    activeDailyCodingChallengeQuestion {
        date
        link
        question {
            questionId
            title
            titleSlug
            difficulty
            content
            topicTags {
                name
            }
            codeSnippets {
                lang
                langSlug
                code
            }
        }
    }
}
"""

# Query to get problem details by slug
PROBLEM_DETAIL_QUERY = """
query questionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        content
        topicTags {
            name
        }
        codeSnippets {
            lang
            langSlug
            code
        }
        hints
    }
}
"""

# In-memory cache for the current daily problem
_daily_cache: Optional[dict] = None
_daily_cache_date: Optional[str] = None


def _parse_examples(html_content: str) -> list[ProblemExample]:
    """Extract examples from the problem HTML content."""
    examples = []
    if not html_content:
        return examples

    # LeetCode uses <strong class="example"> tags for examples
    # Pattern: find example blocks
    example_pattern = re.compile(
        r'<strong[^>]*>Example\s*\d*:?\s*</strong>(.*?)(?=<strong[^>]*>Example|<strong[^>]*>Constraints|<p><strong>Constraints|$)',
        re.DOTALL | re.IGNORECASE
    )

    matches = example_pattern.findall(html_content)
    for match in matches:
        # Extract input, output, explanation
        input_match = re.search(r'<strong>Input:?\s*</strong>\s*(.*?)(?=<strong>|<br|</p>)', match, re.DOTALL)
        output_match = re.search(r'<strong>Output:?\s*</strong>\s*(.*?)(?=<strong>|<br|</p>)', match, re.DOTALL)
        explain_match = re.search(r'<strong>Explanation:?\s*</strong>\s*(.*?)(?=<strong>|</p>|$)', match, re.DOTALL)

        input_text = _clean_html(input_match.group(1)) if input_match else ""
        output_text = _clean_html(output_match.group(1)) if output_match else ""
        explanation = _clean_html(explain_match.group(1)) if explain_match else None

        if input_text or output_text:
            examples.append(ProblemExample(
                input=input_text.strip(),
                output=output_text.strip(),
                explanation=explanation.strip() if explanation else None,
            ))

    return examples


def _parse_constraints(html_content: str) -> list[str]:
    """Extract constraints from the problem HTML content."""
    constraints = []
    if not html_content:
        return constraints

    # Find constraints section
    constraint_match = re.search(
        r'<strong>Constraints:?\s*</strong>\s*</p>\s*<ul>(.*?)</ul>',
        html_content, re.DOTALL | re.IGNORECASE
    )
    if constraint_match:
        items = re.findall(r'<li>(.*?)</li>', constraint_match.group(1), re.DOTALL)
        for item in items:
            cleaned = _clean_html(item).strip()
            if cleaned:
                constraints.append(cleaned)

    return constraints


def _clean_html(text: str) -> str:
    """Remove HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = text.strip()
    return text


async def fetch_daily_challenge() -> DailyProblem:
    """Fetch today's LeetCode daily challenge."""
    global _daily_cache, _daily_cache_date

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Return cache if valid
    if _daily_cache and _daily_cache_date == today:
        logger.info("Returning cached daily challenge for %s", today)
        return DailyProblem(**_daily_cache)

    logger.info("Fetching daily challenge from LeetCode GraphQL...")

    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": DAILY_CHALLENGE_QUERY},
            headers={
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
                "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
            },
        )
        response.raise_for_status()
        data = response.json()

    daily_data = data.get("data", {}).get("activeDailyCodingChallengeQuestion")
    if not daily_data:
        raise ValueError("No daily challenge data returned from LeetCode")

    question = daily_data["question"]
    content = question.get("content", "")

    snippets: dict[str, str] = {}
    for snip in question.get("codeSnippets", []) or []:
        slug_key = snip.get("langSlug", "").lower()
        code_str = snip.get("code", "")
        snippets[slug_key] = code_str
        if slug_key == "python3":
            snippets["python"] = code_str

    problem = DailyProblem(
        id=int(question["questionId"]),
        title=question["title"],
        slug=question["titleSlug"],
        difficulty=question["difficulty"],
        description=content,
        examples=_parse_examples(content),
        constraints=_parse_constraints(content),
        tags=[tag["name"] for tag in question.get("topicTags", [])],
        url=f"https://leetcode.com/problems/{question['titleSlug']}/",
        date=daily_data.get("date", today),
        fetched_at=datetime.now(timezone.utc).isoformat(),
        code_snippets=snippets,
    )

    # Cache
    _daily_cache = problem.model_dump()
    _daily_cache_date = today

    logger.info("Fetched daily challenge: %s (%s)", problem.title, problem.difficulty)
    return problem


async def fetch_problem_by_slug(slug: str) -> DailyProblem:
    """Fetch a specific problem by its slug."""
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={
                "query": PROBLEM_DETAIL_QUERY,
                "variables": {"titleSlug": slug},
            },
            headers={
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
                "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
            },
        )
        response.raise_for_status()
        data = response.json()

    question = data.get("data", {}).get("question")
    if not question:
        raise ValueError(f"Problem '{slug}' not found")

    content = question.get("content", "")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    snippets: dict[str, str] = {}
    for snip in question.get("codeSnippets", []) or []:
        slug_key = snip.get("langSlug", "").lower()
        code_str = snip.get("code", "")
        snippets[slug_key] = code_str
        if slug_key == "python3":
            snippets["python"] = code_str

    return DailyProblem(
        id=int(question["questionId"]),
        title=question["title"],
        slug=question["titleSlug"],
        difficulty=question["difficulty"],
        description=content,
        examples=_parse_examples(content),
        constraints=_parse_constraints(content),
        tags=[tag["name"] for tag in question.get("topicTags", [])],
        url=f"https://leetcode.com/problems/{question['titleSlug']}/",
        date=today,
        fetched_at=datetime.now(timezone.utc).isoformat(),
        code_snippets=snippets,
    )


async def fetch_code_snippets(slug: str) -> dict[str, str]:
    """Fetch code snippets (function signatures) for a problem."""
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={
                "query": PROBLEM_DETAIL_QUERY,
                "variables": {"titleSlug": slug},
            },
            headers={
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
                "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
            },
        )
        response.raise_for_status()
        data = response.json()

    question = data.get("data", {}).get("question")
    if not question:
        return {}

    snippets = {}
    for snippet in question.get("codeSnippets", []):
        lang_slug = snippet["langSlug"]
        snippets[lang_slug] = snippet["code"]

    return snippets


def clear_daily_cache():
    """Clear the daily challenge cache."""
    global _daily_cache, _daily_cache_date
    _daily_cache = None
    _daily_cache_date = None
