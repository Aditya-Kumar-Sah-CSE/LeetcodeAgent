"""
Core configuration for the LeetCode AI Agent backend.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False

    # OpenRouter
    OPENROUTER_API_KEY: Optional[str] = None
    VITE_OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    def get_openrouter_api_key(self) -> Optional[str]:
        """Return configured OpenRouter API key if present."""
        return self.OPENROUTER_API_KEY or self.VITE_OPENROUTER_API_KEY

    # Groq LPU
    GROQ_API_KEY: Optional[str] = None
    VITE_GROQ_API_KEY: Optional[str] = None

    def get_groq_api_key(self) -> Optional[str]:
        """Return configured Groq API key if present."""
        return self.GROQ_API_KEY or self.VITE_GROQ_API_KEY

    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None
    VITE_GEMINI_API_KEY: Optional[str] = None

    def get_gemini_api_key(self) -> Optional[str]:
        """Return the configured Gemini API key if present."""
        return self.GEMINI_API_KEY or self.VITE_GEMINI_API_KEY

    # Solution workspace
    SOLUTIONS_DIR: str = "./solutions"

    # Request timeouts (seconds)
    REQUEST_TIMEOUT: int = 30
    AI_REQUEST_TIMEOUT: int = 120

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
