import pytest
import pytest_asyncio
from app.services.leetcode_service import (
    fetch_daily_challenge,
    fetch_topic_tags,
    fetch_practice_problems,
)


@pytest.mark.asyncio
async def test_fetch_daily_challenge_has_real_frontend_id():
    daily = await fetch_daily_challenge()
    assert daily.id > 0
    assert len(daily.slug) > 0
    assert daily.difficulty in ("Easy", "Medium", "Hard")
    assert isinstance(daily.tags, list)


@pytest.mark.asyncio
async def test_fetch_topic_tags():
    tags = await fetch_topic_tags()
    assert len(tags) >= 20
    slugs = [t.slug for t in tags]
    assert "array" in slugs
    assert "depth-first-search" in slugs


@pytest.mark.asyncio
async def test_fetch_practice_problems_filter():
    res = await fetch_practice_problems(difficulty="MEDIUM", topic="depth-first-search", limit=5)
    assert res.total > 0
    assert len(res.questions) <= 5
    for q in res.questions:
        assert q.difficulty == "Medium"
        assert q.id > 0
