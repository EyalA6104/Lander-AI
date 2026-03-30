import asyncio
import json
import time

import structlog
from google import genai
from pydantic import BaseModel, ValidationError

from app.core.config import get_gemini_api_key
from app.core.metrics import AI_DURATION, AI_ERRORS, AI_RETRIES, AI_SCORES
from app.services.scraper import ScrapedPageData

logger = structlog.stdlib.get_logger("ai_analysis")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODEL_NAME = "gemini-2.5-flash"
_REQUEST_TIMEOUT_SECONDS = 30
_MAX_RETRIES = 2
_MIN_SUGGESTIONS = 3
_MAX_SUGGESTIONS = 5
_MAX_SUGGESTION_LENGTH = 200


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class AIAnalysisResult(BaseModel):
    score: float
    suggestions: list[str]


class AIAnalysisError(Exception):
    """Raised when the AI analysis fails."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(f"AI analysis failed: {reason}")


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an expert landing-page analyst. You receive structured data scraped \
from a landing page and return a JSON evaluation.

Rules:
- Score the page from 0 to 100 based on content quality, SEO signals, and \
  design/animation usage.
- Provide exactly 3 to 5 short, specific, actionable improvement suggestions.
- Each suggestion must be a single sentence, under 200 characters.
- Return ONLY valid JSON matching the exact schema below. No extra text.
- If the output is not valid JSON, your response is invalid.
- Do not include explanations, markdown, or code fences.
- Do not wrap the JSON in backticks or any other formatting.

JSON schema:
{
  "score": <number 0-100>,
  "suggestions": ["<string>", "<string>", "<string>"]
}
"""


def _build_user_prompt(data: ScrapedPageData) -> str:
    """Build a deterministic user prompt from scraped data."""
    ds = data.design_signals

    sections = [
        f"URL: {data.url}",
        f"Title: {data.title or '(missing)'}",
        f"Meta description: {data.meta_description or '(missing)'}",
        f"H1 headings: {', '.join(data.h1_headings) or '(none)'}",
        f"H2 headings: {', '.join(data.h2_headings) or '(none)'}",
        f"Has animations: {ds.has_animations}",
        f"Animation keyword count: {ds.animation_keyword_count}",
        f"Has animation library: {ds.has_animation_library}",
        f"Detected libraries: {', '.join(ds.detected_libraries) or '(none)'}",
        f"Image count: {ds.image_count}",
        f"Video count: {ds.video_count}",
    ]

    return "Analyze this landing page:\n\n" + "\n".join(sections)


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _extract_balanced_json(text: str, start: int) -> str | None:
    """Extract a balanced JSON object starting from *start* (must be '{')."""
    if start >= len(text) or text[start] != "{":
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _extract_json(raw_text: str) -> str:
    """Extract the first JSON object from raw text, ignoring surrounding noise."""
    stripped = raw_text.strip()

    # Strip markdown code fences first
    if "```" in stripped:
        lines = stripped.split("\n")
        inside_fence = False
        json_lines: list[str] = []
        for line in lines:
            if line.strip().startswith("```"):
                inside_fence = not inside_fence
                continue
            if inside_fence:
                json_lines.append(line)
        if json_lines:
            stripped = "\n".join(json_lines).strip()

    # Find the first '{' and extract a balanced object
    brace_pos = stripped.find("{")
    if brace_pos != -1:
        balanced = _extract_balanced_json(stripped, brace_pos)
        if balanced:
            return balanced

    return stripped


def _normalize_suggestions(suggestions: list[str]) -> list[str]:
    """Clean, trim, and enforce length limits on suggestions."""
    cleaned: list[str] = []
    for s in suggestions:
        if not isinstance(s, str):
            continue
        s = s.strip()
        if not s:
            continue
        # Truncate long suggestions
        if len(s) > _MAX_SUGGESTION_LENGTH:
            s = s[:_MAX_SUGGESTION_LENGTH].rstrip() + "…"
        cleaned.append(s)

    # Enforce 3-5 range
    if len(cleaned) > _MAX_SUGGESTIONS:
        cleaned = cleaned[:_MAX_SUGGESTIONS]

    return cleaned


def _parse_ai_response(raw_text: str) -> AIAnalysisResult:
    """Parse and validate the raw AI text into a typed result."""
    json_str = _extract_json(raw_text)

    try:
        payload = json.loads(json_str)
    except json.JSONDecodeError as exc:
        AI_ERRORS.labels(reason="parse_error").inc()
        logger.debug("ai_json_parse_failed", raw_text=raw_text[:500])
        raise AIAnalysisError(f"AI returned invalid JSON: {exc}")

    try:
        result = AIAnalysisResult.model_validate(payload)
    except ValidationError as exc:
        AI_ERRORS.labels(reason="schema_error").inc()
        logger.debug("ai_schema_mismatch", raw_text=raw_text[:500])
        raise AIAnalysisError(f"AI response does not match schema: {exc}")

    result.score = round(max(0.0, min(100.0, result.score)), 1)
    result.suggestions = _normalize_suggestions(result.suggestions)

    if len(result.suggestions) < _MIN_SUGGESTIONS:
        AI_ERRORS.labels(reason="insufficient_suggestions").inc()
        raise AIAnalysisError(
            f"AI returned only {len(result.suggestions)} suggestion(s), "
            f"expected at least {_MIN_SUGGESTIONS}"
        )

    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyze_with_ai(scraped_data: ScrapedPageData) -> AIAnalysisResult:
    """Send scraped page data to Gemini and return a structured analysis.

    Args:
        scraped_data: Structured data from the scraper service.

    Returns:
        AIAnalysisResult with a score and suggestions.

    Raises:
        AIAnalysisError: If the API call, timeout, or response parsing fails
            after all retries are exhausted.
    """
    api_key = get_gemini_api_key()
    client = genai.Client(api_key=api_key)

    user_prompt = _build_user_prompt(scraped_data)
    log = logger.bind(url=scraped_data.url)
    log.info("ai_analysis_started")

    last_error: AIAnalysisError | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        attempt_start = time.perf_counter()
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=_MODEL_NAME,
                    contents=user_prompt,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        temperature=0.2,
                        max_output_tokens=1024,
                        response_mime_type="application/json",
                        response_schema=AIAnalysisResult,
                    ),
                ),
                timeout=_REQUEST_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            AI_DURATION.observe(time.perf_counter() - attempt_start)
            AI_ERRORS.labels(reason="timeout").inc()
            log.error("ai_timeout", attempt=attempt, max_retries=_MAX_RETRIES)
            last_error = AIAnalysisError(
                f"AI request timed out after {_REQUEST_TIMEOUT_SECONDS}s"
            )
            if attempt < _MAX_RETRIES:
                AI_RETRIES.inc()
            continue
        except Exception as exc:
            AI_DURATION.observe(time.perf_counter() - attempt_start)
            AI_ERRORS.labels(reason="api_error").inc()
            log.error("ai_api_error", error=str(exc))
            raise AIAnalysisError(f"API request failed: {exc}")

        AI_DURATION.observe(time.perf_counter() - attempt_start)

        raw_text = response.text
        if not raw_text:
            AI_ERRORS.labels(reason="empty_response").inc()
            last_error = AIAnalysisError("AI returned an empty response")
            log.warning("ai_empty_response", attempt=attempt, max_retries=_MAX_RETRIES)
            if attempt < _MAX_RETRIES:
                AI_RETRIES.inc()
            continue

        log.debug("ai_raw_response", attempt=attempt, response=raw_text[:500])

        try:
            result = _parse_ai_response(raw_text)
            AI_SCORES.observe(result.score)
            log.info(
                "ai_analysis_completed",
                attempt=attempt,
                score=result.score,
                suggestion_count=len(result.suggestions),
            )
            return result
        except AIAnalysisError as exc:
            last_error = exc
            log.warning(
                "ai_parse_failed",
                attempt=attempt,
                max_retries=_MAX_RETRIES,
                reason=exc.reason,
            )
            if attempt < _MAX_RETRIES:
                AI_RETRIES.inc()
            continue

    raise last_error  # type: ignore[misc]
