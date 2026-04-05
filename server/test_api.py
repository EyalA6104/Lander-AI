import asyncio
from google import genai
from pydantic import BaseModel
import sys
import os

from dotenv import load_dotenv

load_dotenv("c:/Users/eyala/Lander-AI/server/.env")

_SYSTEM_PROMPT = """\
You are an expert landing-page analyst.
JSON schema:
{
  "score": <number 0-100>,
  "suggestions": ["<string>", "<string>", "<string>"]
}
"""

async def test():
    client = genai.Client()
    response = await client.aio.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents="Analyze this landing page:\nURL: https://example.com",
        config=genai.types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            temperature=0.2,
            max_output_tokens=1024,
            response_mime_type="application/json",
        ),
    )
    print("OUTPUT:", repr(response.text))

if __name__ == "__main__":
    asyncio.run(test())
