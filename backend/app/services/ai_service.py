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


# Curated Primary DSA & Competitive Programming Models
PRIMARY_MODELS: list[AIModel] = [
    # ─── Google Gemini (Direct Google AI Studio - 100% Free) ───
    AIModel(
        id="gemini-2.0-flash",
        name="Gemini 2.0 Flash (Google AI Studio)",
        provider="Google",
        context_length=1048576,
        is_free=True,
        tier="low",
        specification="Low Latency • 1M Context • Rapid CP Feedback",
        speed="⚡ Ultra-Fast (<0.8s)",
        reasoning_power="High",
        description="Google's ultra-fast flagship multimodal model with generous free tier limits on Google AI Studio.",
        required_key="gemini",
        required_key_name="Google Gemini API Key",
        key_url="https://aistudio.google.com/app/apikey",
        pricing_type="100% Free (Google AI Studio)",
        token_limit="1,048,576 Tokens (1M Ctx)",
        best_for="Real-time coding hints, sliding window, graph algorithms",
    ),
    AIModel(
        id="gemini-1.5-flash",
        name="Gemini 1.5 Flash (Google AI Studio)",
        provider="Google",
        context_length=1048576,
        is_free=True,
        tier="low",
        specification="Low Latency • 1M Context • Rock-Solid Stability",
        speed="⚡ Fast (~1.0s)",
        reasoning_power="High",
        description="High-throughput low-latency model for rapid DSA code analysis.",
        required_key="gemini",
        required_key_name="Google Gemini API Key",
        key_url="https://aistudio.google.com/app/apikey",
        pricing_type="100% Free (Google AI Studio)",
        token_limit="1,048,576 Tokens (1M Ctx)",
        best_for="Instant syntax review and test case analysis",
    ),
    AIModel(
        id="gemini-1.5-pro",
        name="Gemini 1.5 Pro (Google AI Studio)",
        provider="Google",
        context_length=2097152,
        is_free=True,
        tier="high",
        specification="High Reasoning • 2M Context • Elite Analytical Thinking",
        speed="🧠 Deep Think (~2.5s)",
        reasoning_power="Maximum",
        description="Google's most capable reasoning engine for complex Hard graphs, DP transitions, and mathematical proofs.",
        required_key="gemini",
        required_key_name="Google Gemini API Key",
        key_url="https://aistudio.google.com/app/apikey",
        pricing_type="100% Free (Google AI Studio)",
        token_limit="2,097,152 Tokens (2M Ctx)",
        best_for="Hard DP transitions, complex recursion trees, mathematical induction",
    ),

    # ─── Groq LPU (Ultra-Fast Hardware Inference - 100% Free) ───
    AIModel(
        id="groq/deepseek-r1-distill-llama-70b",
        name="DeepSeek R1 Distill 70B (Groq LPU)",
        provider="Groq",
        context_length=131072,
        is_free=True,
        tier="high",
        specification="High Reasoning • 128K Context • Hardware-Accelerated CoT",
        speed="⚡ Rapid Deep Think (<0.8s)",
        reasoning_power="Maximum",
        description="DeepSeek R1 reasoning architecture accelerated by Groq LPU hardware for instant math proofs.",
        required_key="groq",
        required_key_name="Groq API Key",
        key_url="https://console.groq.com/keys",
        pricing_type="100% Free (Groq Tier)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Deep algorithmic reasoning, Hard problems, step-by-step thinking",
    ),
    AIModel(
        id="groq/llama-3.3-70b-versatile",
        name="Llama 3.3 70B Versatile (Groq LPU)",
        provider="Groq",
        context_length=131072,
        is_free=True,
        tier="medium",
        specification="Balanced • 128K Context • 300+ Tokens/Sec LPU Speed",
        speed="⚡ Ultra-Fast (~0.4s • 300+ T/s)",
        reasoning_power="Very High",
        description="Groq LPU accelerated 70B model with blazing fast inference for optimal DSA logic.",
        required_key="groq",
        required_key_name="Groq API Key",
        key_url="https://console.groq.com/keys",
        pricing_type="100% Free (Groq Tier)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Medium LeetCode problems, clean bug-free code generation",
    ),
    AIModel(
        id="groq/llama-3.1-8b-instant",
        name="Llama 3.1 8B Instant (Groq LPU)",
        provider="Groq",
        context_length=131072,
        is_free=True,
        tier="low",
        specification="Low Latency • 128K Context • Sub-300ms Responses",
        speed="⚡ Instant (<0.3s)",
        reasoning_power="Good",
        description="Ultra-fast inference powered by Groq LPU chipsets, delivering rapid code insights.",
        required_key="groq",
        required_key_name="Groq API Key",
        key_url="https://console.groq.com/keys",
        pricing_type="100% Free (Groq Tier)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Instant syntax hints, complexity calculations",
    ),

    # ─── OpenRouter Free Tier (Curated High-Quality Models) ───
    AIModel(
        id="openrouter/free",
        name="OpenRouter Free Router (Auto Best Model)",
        provider="OpenRouter",
        context_length=131072,
        is_free=True,
        tier="medium",
        specification="Balanced • 128K Context • Dynamic Best Free Model",
        speed="🚀 Normal (~1.5s)",
        reasoning_power="Very High",
        description="Automatically routes to the highest-performing available free model with 99.9% uptime.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Reliable all-round problem solving",
    ),
    AIModel(
        id="deepseek/deepseek-r1:free",
        name="DeepSeek R1 Reasoning (Free)",
        provider="DeepSeek",
        context_length=65536,
        is_free=True,
        tier="high",
        specification="High Reasoning • 64K Context • Chain-of-Thought Math Proofs",
        speed="🧠 Deep Think (~3.0s)",
        reasoning_power="Maximum",
        description="Open reasoning model that outputs deep step-by-step thinking traces before coding.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="65,536 Tokens (64K Ctx)",
        best_for="Hard problems, math induction, proof of correctness",
    ),
    AIModel(
        id="qwen/qwen-2.5-coder-32b-instruct:free",
        name="Qwen 2.5 Coder 32B (Free)",
        provider="Qwen",
        context_length=32768,
        is_free=True,
        tier="medium",
        specification="Balanced • 32K Context • SOTA Competitive Coding",
        speed="🚀 Normal (~1.6s)",
        reasoning_power="Very High",
        description="World-class coding benchmarks, ideal for writing complete bug-free solutions.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="32,768 Tokens (32K Ctx)",
        best_for="Competitive coding, strict constraint compliance",
    ),
    AIModel(
        id="meta-llama/llama-3.3-70b-instruct:free",
        name="Llama 3.3 70B Instruct (Free)",
        provider="Meta",
        context_length=131072,
        is_free=True,
        tier="medium",
        specification="Balanced • 128K Context • 70B Flagship Intelligence",
        speed="🚀 Normal (~1.8s)",
        reasoning_power="Very High",
        description="Full-scale 70B reasoning powerhouse for Medium LeetCode problems and optimal DP proofs.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="131,072 Tokens (128K Ctx)",
        best_for="Algorithmic explanation, edge cases",
    ),
    AIModel(
        id="mistralai/mistral-small-3.1-24b-instruct:free",
        name="Mistral Small 24B (Free)",
        provider="Mistral",
        context_length=32768,
        is_free=True,
        tier="medium",
        specification="Balanced • 32K Context • Precision Edge-Case Analysis",
        speed="🚀 Fast (~1.2s)",
        reasoning_power="Very High",
        description="Exceptional precision in catching off-by-one errors and pointer edge-cases.",
        required_key="openrouter",
        required_key_name="OpenRouter API Key",
        key_url="https://openrouter.ai/keys",
        pricing_type="Free Tier (Rate-Limited)",
        token_limit="32,768 Tokens (32K Ctx)",
        best_for="Pointer edge cases, off-by-one bugs",
    ),

    # ─── Autonomous Local Engine (Offline / Zero Keys) ───
    AIModel(
        id="autonomous/local-engine",
        name="Autonomous Algorithmic Engine (Local)",
        provider="LeetCodeAgent",
        context_length=32768,
        is_free=True,
        tier="local",
        specification="Zero-Config • 100% Free • Works Offline • Instant Tools",
        speed="⚡ Instant (<0.1s)",
        reasoning_power="High",
        description="Built-in autonomous engine running directly in your browser. Requires zero API keys or external servers.",
        required_key="none",
        required_key_name="No API Key Required",
        key_url="",
        pricing_type="100% Free & Offline",
        token_limit="Offline / Infinite",
        best_for="Offline usage, instant explanation without keys or network limits",
    ),
]

# Keywords to exclude junk, non-coding, audio, moderation, or unstable preview models
EXCLUDED_KEYWORDS = (
    "lyria", "clip", "preview", "audio", "voice", "tts", "whisper",
    "safety", "guard", "moderation", "flint", "laguna", "dots3",
    "nemotron-3-nano", "nemotron-3-super", "nemotron-3.5", "embed",
)


async def fetch_available_models(api_key: Optional[str] = None) -> list[AIModel]:
    """Fetch available models, prioritizing verified coding models and filtering out junk/audio models."""
    primary_ids = {m.id for m in PRIMARY_MODELS}
    result_models = list(PRIMARY_MODELS)

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
            headers = {"Content-Type": "application/json"}
            key = api_key or settings.OPENROUTER_API_KEY
            if key:
                headers["Authorization"] = f"Bearer {key}"

            response = await client.get(OPENROUTER_MODELS_URL, headers=headers)
            if response.status_code == 200:
                data = response.json()
                for m in data.get("data", []):
                    model_id = m.get("id", "")
                    if not model_id or model_id in primary_ids:
                        continue

                    # Filter: Only keep free models
                    pricing = m.get("pricing", {})
                    prompt_price = str(pricing.get("prompt", "0"))
                    completion_price = str(pricing.get("completion", "0"))
                    is_free = (prompt_price == "0" and completion_price == "0") or model_id.endswith(":free")
                    if not is_free:
                        continue

                    model_id_lower = model_id.lower()
                    name_lower = m.get("name", "").lower()

                    # Filter out junk / non-coding / audio / safety models
                    if any(bad in model_id_lower or bad in name_lower for bad in EXCLUDED_KEYWORDS):
                        continue

                    # Only accept models that have coding / instruct / reasoning keywords
                    coding_keywords = ("coder", "instruct", "code", "deepseek", "llama", "qwen", "mistral", "gemma", "chat")
                    if not any(k in model_id_lower or k in name_lower for k in coding_keywords):
                        continue

                    provider = model_id.split("/")[0] if "/" in model_id else "OpenRouter"
                    ctx = m.get("context_length") or 32768
                    ctx_str = f"{ctx // 1000}K Ctx" if ctx else "32K Ctx"

                    result_models.append(AIModel(
                        id=model_id,
                        name=m.get("name", model_id),
                        provider=provider.capitalize(),
                        context_length=ctx,
                        is_free=True,
                        tier="medium",
                        specification=f"OpenRouter Free • {ctx_str}",
                        speed="🚀 Normal (~1.5s)",
                        reasoning_power="High",
                        description=m.get("description") or "Free model from OpenRouter gateway.",
                        required_key="openrouter",
                        required_key_name="OpenRouter API Key",
                        key_url="https://openrouter.ai/keys",
                        pricing_type="Free Tier (Rate-Limited)",
                        token_limit=f"{ctx:,} Tokens",
                        best_for="General algorithmic problem solving",
                    ))
    except Exception as e:
        logger.warning(f"Could not fetch dynamic models from OpenRouter: {e}")

    return result_models


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
