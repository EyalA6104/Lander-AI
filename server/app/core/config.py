import os

from dotenv import load_dotenv

load_dotenv()


def get_gemini_api_key() -> str:
    """Return the Gemini API key from environment variables."""
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set in environment variables")
    return key
