"""
OpenRouter AI service for model catalog and chat completions.
"""

import httpx
import logging
from typing import Optional

from app.core.config import settings
from app.models.schemas import AIModel

logger = logging.getLogger(__name__)

OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"


async def fetch_available_models(api_key: Optional[str] = None) -> list[AIModel]:
    """Fetch available models from OpenRouter, highlighting free ones."""
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        headers = {"Content-Type": "application/json"}
        key = api_key or settings.OPENROUTER_API_KEY
        if key:
            headers["Authorization"] = f"Bearer {key}"

        response = await client.get(OPENROUTER_MODELS_URL, headers=headers)
        response.raise_for_status()
        data = response.json()

    models = []
    for m in data.get("data", []):
        model_id = m.get("id", "")
        name = m.get("name", model_id)

        # Determine if model is free by checking pricing
        pricing = m.get("pricing", {})
        prompt_price = str(pricing.get("prompt", "0"))
        completion_price = str(pricing.get("completion", "0"))
        is_free = prompt_price == "0" and completion_price == "0"

        # Extract provider from model id (e.g., "google/gemma-..." -> "google")
        provider = model_id.split("/")[0] if "/" in model_id else ""

        context_length = m.get("context_length")

        models.append(AIModel(
            id=model_id,
            name=name,
            provider=provider,
            context_length=context_length,
            is_free=is_free,
            description=m.get("description"),
        ))

    # Sort: free models first, then by name
    models.sort(key=lambda x: (not x.is_free, x.name.lower()))
    return models


async def chat_completion(
    messages: list[dict],
    model_id: str,
    api_key: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Send a chat completion request to OpenRouter."""
    key = api_key or settings.OPENROUTER_API_KEY
    if not key:
        raise ValueError(
            "No API key configured. Please set OPENROUTER_API_KEY in .env "
            "or provide your key in Settings."
        )

    async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT) as client:
        response = await client.post(
            OPENROUTER_CHAT_URL,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "LeetCode AI Agent",
            },
            json={
                "model": model_id,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()
        data = response.json()

    choices = data.get("choices", [])
    if not choices:
        raise ValueError("No response from AI model")

    return choices[0].get("message", {}).get("content", "")
