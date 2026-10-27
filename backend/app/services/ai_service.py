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


# Curated Top 5 Primary DSA & Competitive Programming Models
PRIMARY_MODELS: list[AIModel] = [
    # 1. Google Gemini 3 Flash
    AIModel(
        id="gemini-3-flash-preview",
        name="Gemini 3 Flash (Google AI Studio)",
        provider="Google",
        context_length=1048576,
        is_free=True,
        tier="low",
        specification="Ultra Latency • 1M Context • Rapid CP Feedback",
        speed="⚡ Ultra-Fast (<0.5s)",
        reasoning_power="High",
        description="Google's latest flagship high-speed model with generous free tier on Google AI Studio.",
        required_key="gemini",
        required_key_name="Google Gemini API Key",
        key_url="https://aistudio.google.com/app/apikey",
        pricing_type="100% Free (Google AI Studio)",
        token_limit="1,048,576 Tokens (1M Ctx)",
        best_for="Real-time coding hints, sliding window, graph algorithms",
    ),
    # 2. Google Gemini 3.8 Flash
    AIModel(
        id="gemini-3.8-flash",
        name="Gemini 3.8 Flash (Google AI Studio)",
        provider="Google",
        context_length=1048576,
        is_free=True,
        tier="high",
        specification="High Reasoning • Optimal LeetCode Solutions",
        speed="⚡ Fast (~0.8s)",
        reasoning_power="Maximum",
        description="Next-gen Gemini reasoning model with deep competitive programming heuristics.",
        required_key="gemini",
        required_key_name="Google Gemini API Key",
        key_url="https://aistudio.google.com/app/apikey",
        pricing_type="100% Free (Google AI Studio)",
        token_limit="1,048,576 Tokens (1M Ctx)",
        best_for="Dynamic programming, advanced graph algorithms",
    ),
    # 3. Groq GPT-OSS 120B
    AIModel(
        id="openai/gpt-oss-120b",
        name="GPT-OSS 120B (Groq LPU)",
        provider="Groq",
        context_length=131072,
        is_free=True,
        tier="high",
        specification="High Reasoning • 128K Context • 120B Parameters",
        speed="⚡ Instant (<0.3s)",
        reasoning_power="Maximum",
        description="Massive 120-billion parameter model accelerated by Groq LPUs for extreme code correctness.",
        required_key="groq",
        required_key_name="Groq API Key",
        key_url="https://console.groq.com/keys",
        pricing_type="100% Free (Groq Tier)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Optimal DSA logic, complex constraints, Hard problems",
    ),
    # 4. Groq Qwen 3.8 27B Coder
    AIModel(
        id="qwen/qwen3.8-27b",
        name="Qwen 3.8 27B Coder (Groq LPU)",
        provider="Groq",
        context_length=131072,
        is_free=True,
        tier="medium",
        specification="Balanced • 128K Context • Math & CP Specialized",
        speed="⚡ Instant (<0.3s)",
        reasoning_power="Very High",
        description="Specialized algorithmic reasoning and competitive programming model on Groq hardware.",
        required_key="groq",
        required_key_name="Groq API Key",
        key_url="https://console.groq.com/keys",
        pricing_type="100% Free (Groq Tier)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Competitive coding, strict constraint compliance, trees & graphs",
    ),
    # 5. OpenRouter Auto Best Coder
    AIModel(
        id="openrouter/free",
        name="OpenRouter Auto Best Coder (Unified)",
        provider="OpenRouter",
        context_length=131072,
        is_free=True,
        tier="medium",
        specification="Balanced • 128K Context • Dynamic Best Free Model",
        speed="🚀 Fast (~1.2s)",
        reasoning_power="Very High",
        description="Automatically routes requests to the highest-performing available free coding model with 99.9% uptime.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Reliable all-round problem solving",
    ),
]


async def fetch_available_models(api_key: Optional[str] = None) -> list[AIModel]:
    """Return exclusively the curated Top 5 verified coding models that solve DSA problems correctly."""
    return list(PRIMARY_MODELS)


async def gemini_completion(
    messages: list[dict],
    model_id: str,
    gemini_key: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Send a completion request directly to Google Gemini API (Google AI Studio)."""
    clean_model = model_id.replace("models/", "").replace("google/", "")
    candidate_models = list(dict.fromkeys([
        clean_model if clean_model.startswith("gemini") else None,
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]))
    candidate_models = [m for m in candidate_models if m]

    system_instruction = None
    contents = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "system":
            system_instruction = {"parts": [{"text": content}]}
        else:
            g_role = "model" if role == "assistant" else "user"
            contents.append({"role": g_role, "parts": [{"text": content}]})

    if not contents:
        contents = [{"role": "user", "parts": [{"text": "Solve this coding problem"}]}]
    elif contents[0]["role"] != "user":
        contents.insert(0, {"role": "user", "parts": [{"text": "Hello"}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction

    last_err = None
    async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT) as client:
        for m_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={gemini_key.strip()}"
            try:
                res = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json", "x-goog-api-key": gemini_key.strip()},
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    err_msg = res.text
                    logger.warning(f"Gemini {m_name} returned {res.status_code}: {err_msg}")
                    last_err = Exception(f"Gemini {m_name} HTTP {res.status_code}: {err_msg}")
            except Exception as e:
                logger.warning(f"Gemini {m_name} failed: {e}")
                last_err = e

    if last_err:
        raise last_err
    raise ValueError("All Gemini candidate models failed to return a response.")


async def groq_completion(
    messages: list[dict],
    model_id: str,
    groq_key: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Send a chat completion request to Groq LPU."""
    clean_model = model_id.replace("groq/", "") if model_id.startswith("groq/") else model_id
    candidate_models = list(dict.fromkeys([
        clean_model if clean_model and clean_model != "auto" else None,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.1-8b-instant",
    ]))
    candidate_models = [m for m in candidate_models if m]

    last_err = None
    async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT) as client:
        for m_name in candidate_models:
            try:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key.strip()}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeetCodeAgent/1.0",
                    },
                    json={
                        "model": m_name,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
                else:
                    last_err = Exception(f"Groq {m_name} HTTP {response.status_code}: {response.text}")
            except Exception as e:
                last_err = e

    if last_err:
        raise last_err
    raise ValueError("All Groq models failed")


async def chat_completion(
    messages: list[dict],
    model_id: str,
    api_key: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Send a chat completion request to Gemini, Groq, or OpenRouter."""
    gemini_key = settings.get_gemini_api_key()
    groq_key = settings.get_groq_api_key()
    openrouter_key = settings.get_openrouter_api_key()

    is_gemini_key = bool(api_key and (api_key.startswith("AQ.") or api_key.startswith("AIza")))
    is_groq_key = bool(api_key and api_key.startswith("gsk_"))
    effective_gemini_key = api_key if is_gemini_key else gemini_key
    effective_groq_key = api_key if is_groq_key else groq_key
    effective_openrouter_key = api_key if (not is_gemini_key and not is_groq_key and api_key) else openrouter_key

    is_groq_model = (
        model_id.startswith("groq/")
        or model_id.startswith("llama-")
        or "gpt-oss" in model_id
        or "qwen3.8" in model_id
    )

    # 1. Route to Groq
    if effective_groq_key and (is_groq_key or is_groq_model):
        return await groq_completion(
            messages=messages,
            model_id=model_id,
            groq_key=effective_groq_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    # 2. Route to Gemini
    if effective_gemini_key and (model_id.startswith("gemini") or is_gemini_key or (not effective_openrouter_key and not effective_groq_key)):
        return await gemini_completion(
            messages=messages,
            model_id=model_id if model_id.startswith("gemini") else "gemini-3-flash-preview",
            gemini_key=effective_gemini_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    # 3. Route to OpenRouter
    key = effective_openrouter_key
    if not key:
        # Fall back to whichever key is present
        if effective_gemini_key:
            return await gemini_completion(messages, "gemini-3-flash-preview", effective_gemini_key, temperature, max_tokens)
        if effective_groq_key:
            return await groq_completion(messages, "openai/gpt-oss-120b", effective_groq_key, temperature, max_tokens)
        raise ValueError(
            "No API key configured. Please set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in .env "
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
                "model": model_id if not model_id.startswith("gemini") else "openrouter/free",
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
