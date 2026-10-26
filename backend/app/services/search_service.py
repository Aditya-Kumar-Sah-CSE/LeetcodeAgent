"""
Web search service using DuckDuckGo for free algorithm research.
Includes SSRF protection - blocks private/internal network destinations.
"""

import httpx
import logging
import re
from urllib.parse import urlparse, quote_plus
from typing import Optional
import ipaddress

from app.models.schemas import SearchResult, SearchResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

# SSRF protection: blocked hosts and IP ranges
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"}
BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / cloud metadata
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

DUCKDUCKGO_HTML_URL = "https://html.duckduckgo.com/html/"


def _is_url_safe(url: str) -> bool:
    """Check that a URL doesn't point to a private/internal network."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False
        if hostname.lower() in BLOCKED_HOSTS:
            return False
        # Try parsing as IP
        try:
            ip = ipaddress.ip_address(hostname)
            for network in BLOCKED_IP_RANGES:
                if ip in network:
                    return False
        except ValueError:
            pass  # It's a hostname, not an IP - that's fine
        return True
    except Exception:
        return False


async def search_web(query: str, max_results: int = 5) -> SearchResponse:
    """
    Search the web using DuckDuckGo HTML endpoint.
    Returns algorithm documentation and explanations.
    """
    safe_query = f"algorithm {query} explanation"

    try:
        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.post(
                DUCKDUCKGO_HTML_URL,
                data={"q": safe_query, "b": ""},
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/html",
                },
            )
            response.raise_for_status()
            html_content = response.text

        results = _parse_ddg_results(html_content, max_results)

        return SearchResponse(
            query=query,
            results=results,
        )

    except httpx.TimeoutException:
        logger.warning("Search timed out for query: %s", query)
        return SearchResponse(query=query, error="Search timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        logger.warning("Search HTTP error: %s", e.response.status_code)
        return SearchResponse(query=query, error=f"Search returned status {e.response.status_code}")
    except Exception as e:
        logger.error("Search error: %s", str(e))
        return SearchResponse(query=query, error=f"Search failed: {str(e)}")


def _parse_ddg_results(html_content: str, max_results: int) -> list[SearchResult]:
    """Parse DuckDuckGo HTML search results."""
    results = []

    # DuckDuckGo HTML results are in <a class="result__a"> tags
    result_pattern = re.compile(
        r'<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)</a>.*?'
        r'<a[^>]*class="result__snippet"[^>]*>(.*?)</a>',
        re.DOTALL
    )

    matches = result_pattern.findall(html_content)

    for url, title, snippet in matches[:max_results]:
        # Clean HTML from title and snippet
        clean_title = re.sub(r'<[^>]+>', '', title).strip()
        clean_snippet = re.sub(r'<[^>]+>', '', snippet).strip()

        # SSRF check
        if not _is_url_safe(url):
            continue

        if clean_title and clean_snippet:
            results.append(SearchResult(
                title=clean_title,
                url=url,
                snippet=clean_snippet,
            ))

    return results
