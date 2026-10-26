"""
LeetCode Daily Challenge fetcher using LeetCode's public GraphQL endpoint.
"""

import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Any
import re
import html

from app.models.schemas import (
    DailyProblem,
    ProblemExample,
    ProblemBrief,
    TopicTag,
    ProblemListResponse,
    ContestBrief,
    ContestQuestion,
    ContestDetail,
)
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
        }
    }
}
"""

# Query to get problem details by slug
PROBLEM_DETAIL_QUERY = """
query questionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
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
    }
}
"""

# Query to get practice problems by difficulty and topic tag
PROBLEMSET_QUERY = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
    ) {
        total: totalNum
        questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags {
                name
                slug
            }
        }
    }
}
"""

# Query to get all official LeetCode topic tags
TOPIC_TAGS_QUERY = """
query getTopicTags {
    questionTopicTags {
        edges {
            node {
                name
                slug
            }
        }
    }
}
"""

# In-memory cache for the current daily problem & topics
_daily_cache: Optional[dict] = None
_daily_cache_date: Optional[str] = None
_topic_tags_cache: list[TopicTag] = []


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
        id=int(question.get("questionFrontendId") or question.get("questionId") or 0),
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

    logger.info("Fetched daily challenge: #%d %s (%s)", problem.id, problem.title, problem.difficulty)
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
        id=int(question.get("questionFrontendId") or question.get("questionId") or 0),
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


async def fetch_topic_tags() -> list[TopicTag]:
    """Fetch all official LeetCode DSA topics."""
    global _topic_tags_cache
    if _topic_tags_cache:
        return _topic_tags_cache

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
            response = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": TOPIC_TAGS_QUERY},
                headers={
                    "Content-Type": "application/json",
                    "Referer": "https://leetcode.com",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            )
            response.raise_for_status()
            data = response.json()

        edges = data.get("data", {}).get("questionTopicTags", {}).get("edges", [])
        tags = []
        for edge in edges:
            node = edge.get("node", {})
            name = node.get("name")
            slug = node.get("slug")
            if name and slug:
                tags.append(TopicTag(name=name, slug=slug))

        if tags:
            _topic_tags_cache = tags
            return tags
    except Exception as e:
        logger.warning("Could not fetch live topic tags from LeetCode (%s), using curated defaults", e)

    # Curated fallbacks if network unreachable
    fallback_topics = [
        {"name": "Array", "slug": "array"},
        {"name": "String", "slug": "string"},
        {"name": "Hash Table", "slug": "hash-table"},
        {"name": "Dynamic Programming", "slug": "dynamic-programming"},
        {"name": "Math", "slug": "math"},
        {"name": "Sorting", "slug": "sorting"},
        {"name": "Greedy", "slug": "greedy"},
        {"name": "Depth-First Search", "slug": "depth-first-search"},
        {"name": "Binary Search", "slug": "binary-search"},
        {"name": "Matrix", "slug": "matrix"},
        {"name": "Tree", "slug": "tree"},
        {"name": "Breadth-First Search", "slug": "breadth-first-search"},
        {"name": "Bit Manipulation", "slug": "bit-manipulation"},
        {"name": "Two Pointers", "slug": "two-pointers"},
        {"name": "Prefix Sum", "slug": "prefix-sum"},
        {"name": "Heap (Priority Queue)", "slug": "heap-priority-queue"},
        {"name": "Binary Tree", "slug": "binary-tree"},
        {"name": "Simulation", "slug": "simulation"},
        {"name": "Stack", "slug": "stack"},
        {"name": "Graph", "slug": "graph"},
        {"name": "Sliding Window", "slug": "sliding-window"},
        {"name": "Backtracking", "slug": "backtracking"},
        {"name": "Union Find", "slug": "union-find"},
        {"name": "Linked List", "slug": "linked-list"},
        {"name": "Monotonic Stack", "slug": "monotonic-stack"},
        {"name": "Recursion", "slug": "recursion"},
        {"name": "Divide and Conquer", "slug": "divide-and-conquer"},
        {"name": "Trie", "slug": "trie"},
    ]
    return [TopicTag(**t) for t in fallback_topics]


async def fetch_practice_problems(
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    search: Optional[str] = None,
    username: Optional[str] = None,
) -> ProblemListResponse:
    """Fetch practice problems from LeetCode filtered by difficulty, topic, search query, with solved marking."""
    filters: dict[str, Any] = {}
    if difficulty and difficulty.upper() in ("EASY", "MEDIUM", "HARD"):
        filters["difficulty"] = difficulty.upper()
    if topic and topic.lower() not in ("all", ""):
        filters["tags"] = [topic.lower()]
    if search and search.strip():
        filters["searchKeywords"] = search.strip()

    # If username provided, get their solved slugs
    user_solved_slugs: set[str] = set()
    if username:
        try:
            from app.services.profile_service import fetch_public_profile
            prof = await fetch_public_profile(username)
            if prof and prof.solved_slugs:
                user_solved_slugs = set(prof.solved_slugs)
        except Exception as e:
            logger.warning("Could not fetch user solved slugs for %s: %s", username, e)

    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={
                "query": PROBLEMSET_QUERY,
                "variables": {
                    "categorySlug": "",
                    "limit": min(limit, 50),
                    "skip": max(skip, 0),
                    "filters": filters,
                },
            },
            headers={
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
        )
        response.raise_for_status()
        data = response.json()

    result = data.get("data", {}).get("problemsetQuestionList", {})
    total = result.get("total") or 0
    raw_questions = result.get("questions") or []

    questions = []
    for q in raw_questions:
        q_id = int(q.get("questionFrontendId") or q.get("questionId") or 0)
        title = q.get("title", "")
        slug = q.get("titleSlug", "")
        diff = q.get("difficulty", "Medium")
        tags = [t["name"] for t in q.get("topicTags", []) if "name" in t]
        url = f"https://leetcode.com/problems/{slug}/"
        is_solved = (slug in user_solved_slugs) if user_solved_slugs else False

        questions.append(ProblemBrief(
            id=q_id,
            title=title,
            slug=slug,
            difficulty=diff,
            tags=tags,
            url=url,
            is_solved=is_solved,
        ))

    return ProblemListResponse(total=total, questions=questions)


# ─── Live & Virtual Contests ──────────────────────────────────

ALL_CONTESTS_QUERY = """
query {
    allContests {
        title
        titleSlug
        startTime
        duration
        originStartTime
        isVirtual
    }
}
"""

CONTEST_QUESTIONS_QUERY = """
query contestQuestions($titleSlug: String!) {
    contestQuestionList(contestSlug: $titleSlug) {
        questionId
        title
        titleSlug
        credit
    }
}
"""

_contests_cache = None
_contests_cache_time = 0


async def fetch_contests(limit: int = 1000) -> list[ContestBrief]:
    """Fetch live, upcoming, and past virtual contests from LeetCode."""
    import time
    global _contests_cache, _contests_cache_time
    now = int(time.time())

    if _contests_cache and (now - _contests_cache_time < 300):
        return _contests_cache[:limit]

    raw_contests = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": ALL_CONTESTS_QUERY},
                headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
            data = resp.json()
            raw_contests = data.get("data", {}).get("allContests", [])
    except Exception as e:
        logger.warning(f"Failed to fetch live contests from LeetCode: {e}")

    if not raw_contests:
        # Fallback curated contests
        raw_contests = [
            {"title": "Weekly Contest 527", "titleSlug": "weekly-contest-527", "startTime": now + 86400 * 3, "duration": 5400, "originStartTime": now + 86400 * 3, "isVirtual": False},
            {"title": "Biweekly Contest 195", "titleSlug": "biweekly-contest-195", "startTime": now + 86400 * 2, "duration": 5400, "originStartTime": now + 86400 * 2, "isVirtual": False},
            {"title": "Weekly Contest 525", "titleSlug": "weekly-contest-525", "startTime": now - 86400 * 2, "duration": 5400, "originStartTime": now - 86400 * 2, "isVirtual": False},
            {"title": "Biweekly Contest 194", "titleSlug": "biweekly-contest-194", "startTime": now - 86400 * 4, "duration": 5400, "originStartTime": now - 86400 * 4, "isVirtual": False},
            {"title": "Weekly Contest 524", "titleSlug": "weekly-contest-524", "startTime": now - 86400 * 9, "duration": 5400, "originStartTime": now - 86400 * 9, "isVirtual": False},
            {"title": "Weekly Contest 420", "titleSlug": "weekly-contest-420", "startTime": 1729391400, "duration": 5400, "originStartTime": 1729391400, "isVirtual": False},
        ]

    contests: list[ContestBrief] = []
    for c in raw_contests:
        st = int(c.get("startTime") or 0)
        dur = int(c.get("duration") or 5400)
        slug = c.get("titleSlug", "")
        if st > now:
            status = "UPCOMING"
        elif st <= now <= st + dur:
            status = "LIVE"
        else:
            status = "PAST"

        contests.append(ContestBrief(
            title=c.get("title", ""),
            slug=slug,
            start_time=st,
            duration=dur,
            origin_start_time=int(c.get("originStartTime") or st),
            is_virtual=bool(c.get("isVirtual", False)),
            status=status,
            url=f"https://leetcode.com/contest/{slug}/",
        ))

    # Keep LIVE first, then UPCOMING, then PAST
    contests.sort(key=lambda x: (0 if x.status == "LIVE" else (1 if x.status == "UPCOMING" else 2), -x.start_time))
    _contests_cache = contests
    _contests_cache_time = now
    return contests[:limit]


async def fetch_contest_questions(contest_slug: str, username: Optional[str] = None) -> list[ContestQuestion]:
    """Fetch the 4 problems belonging to a contest."""
    user_solved_slugs: set[str] = set()
    if username:
        try:
            from app.services.profile_service import fetch_public_profile
            profile = await fetch_public_profile(username)
            user_solved_slugs = set(profile.solved_slugs or [])
        except Exception:
            pass

    raw_qs = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": CONTEST_QUESTIONS_QUERY, "variables": {"titleSlug": contest_slug}},
                headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
            data = resp.json()
            raw_qs = data.get("data", {}).get("contestQuestionList", [])
    except Exception as e:
        logger.warning(f"Failed to fetch contest questions for {contest_slug}: {e}")

    questions: list[ContestQuestion] = []
    for q in raw_qs:
        slug = q.get("titleSlug", "")
        credit = int(q.get("credit") or 3)
        if credit <= 3:
            diff = "Easy"
        elif credit in (4, 5):
            diff = "Medium"
        else:
            diff = "Hard"

        questions.append(ContestQuestion(
            id=str(q.get("questionId") or ""),
            title=q.get("title", ""),
            slug=slug,
            credit=credit,
            difficulty=diff,
            url=f"https://leetcode.com/problems/{slug}/",
            is_solved=(slug in user_solved_slugs) if user_solved_slugs else False,
        ))

    return questions


def clear_daily_cache():
    """Clear the daily challenge cache."""
    global _daily_cache, _daily_cache_date
    _daily_cache = None
    _daily_cache_date = None
