"""
LeetCode public profile lookup service.
Uses LeetCode's public GraphQL endpoint to fetch profile data.
"""

import httpx
import logging
from typing import Optional

from app.models.schemas import LeetCodeProfile
from app.core.config import settings

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

PROFILE_QUERY = """
query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
        username
        profile {
            realName
            userAvatar
            ranking
            reputation
        }
        submitStatsGlobal {
            acSubmissionNum {
                difficulty
                count
            }
        }
    }
}
"""


async def fetch_public_profile(username: str) -> Optional[LeetCodeProfile]:
    """Fetch a user's public LeetCode profile."""
    if not username or not username.strip():
        return None

    username = username.strip()
    logger.info("Fetching public profile for: %s", username)

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
            response = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={
                    "query": PROFILE_QUERY,
                    "variables": {"username": username},
                },
                headers={
                    "Content-Type": "application/json",
                    "Referer": "https://leetcode.com",
                    "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
                },
            )
            response.raise_for_status()
            data = response.json()

        user = data.get("data", {}).get("matchedUser")
        if not user:
            logger.warning("User '%s' not found on LeetCode", username)
            return None

        profile_data = user.get("profile", {})
        submit_stats = user.get("submitStatsGlobal", {}).get("acSubmissionNum", [])

        solved = {s["difficulty"]: s["count"] for s in submit_stats}

        return LeetCodeProfile(
            username=user["username"],
            display_name=profile_data.get("realName") or user["username"],
            avatar_url=profile_data.get("userAvatar"),
            ranking=profile_data.get("ranking"),
            solved_total=solved.get("All", 0),
            solved_easy=solved.get("Easy", 0),
            solved_medium=solved.get("Medium", 0),
            solved_hard=solved.get("Hard", 0),
            reputation=profile_data.get("reputation"),
            verified=True,
        )

    except httpx.HTTPStatusError as e:
        logger.error("HTTP error fetching profile: %s", e.response.status_code)
        return None
    except Exception as e:
        logger.error("Error fetching profile: %s", str(e))
        return None
