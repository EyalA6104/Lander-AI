import asyncio
import json
import math
import time

from typing import Any

import structlog
from google import genai
from json_repair import repair_json
from pydantic import BaseModel, ValidationError

from app.core.config import get_gemini_api_key
from app.core.metrics import AI_DURATION, AI_ERRORS, AI_RETRIES, AI_SCORES
from app.services.scraper import ScrapedPageData

logger = structlog.stdlib.get_logger("ai_analysis")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODEL_NAME = "gemini-3.1-flash-lite"
_REQUEST_TIMEOUT_SECONDS = 30
_REPAIR_REQUEST_TIMEOUT_SECONDS = 20
_MAX_RETRIES = 2
_MIN_SUGGESTIONS_PER_SECTION = 1
_MAX_SUGGESTIONS_PER_SECTION = 2
_MAX_SUGGESTION_LENGTH = 200
_MAX_VISIBLE_TEXT_CHARS = 3000
_COMPACT_VISIBLE_TEXT_CHARS = 600
_TEMPERATURE = 0.0
_MAX_OUTPUT_TOKENS = 4096
_COMPACT_MAX_OUTPUT_TOKENS = 2048
_MAX_REPAIR_SOURCE_CHARS = 4000


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class AISectionResult(BaseModel):
    score: float
    suggestions: list[str]


class AIAnalysisResult(BaseModel):
    overallScore: float
    content: AISectionResult
    structure: AISectionResult
    design: AISectionResult
    ux: AISectionResult
    seo: AISectionResult


class AIAnalysisError(Exception):
    """Raised when the AI analysis fails."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(f"AI analysis failed: {reason}")


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an expert landing-page analyst focused on modern, high-converting product \
and SaaS experiences. You receive structured data scraped from a landing page and \
return a JSON evaluation.

Rules:
- Score the page from 0 to 100 overall and also score each section from 0 to 100.
- Use these sections exactly: content, structure, design, ux, seo.
- For each section, provide 1 to 2 short, specific, actionable improvement suggestions.
- Each suggestion must be a single sentence, under 200 characters.
- Judge the page like a modern UX and conversion reviewer, not a metadata checker.
- Do not over-reward pages for strong title tags, meta descriptions, heading hygiene, \
  or the presence of animation libraries when the real user experience appears weak.
- Reward animation only when it likely supports clarity, feedback, delight, or focus \
  without adding distraction, friction, or accessibility risk.
- If evidence is limited, stay conservative and avoid making up visual details.
- If the page appears modern, well-structured, and follows common SaaS patterns \
  (clear hero, visible CTA, clean sections), do not assign low scores solely due \
  to limited evidence. Avoid under-scoring high-quality pages.
- Prioritize UX quality, content clarity, and design polish over SEO signals. Do \
  not penalize pages for missing minor or optional signals.
- Weight the overall score primarily from content clarity, UX quality, and design \
  quality, then structure, then SEO.
- Return ONLY valid JSON matching the exact schema below. No extra text.
- If the output is not valid JSON, your response is invalid.
- Do not include explanations, markdown, or code fences.
- Do not wrap the JSON in backticks or any other formatting.

Scoring rubric:
- content: clarity of the offer, audience fit, differentiation, benefit framing, and \
  whether the message communicates value fast.
- structure: logical flow, section sequencing, scannability, heading hierarchy, and \
  how well the page guides the visitor toward action.
- design: visual hierarchy, polish, media usage, consistency, restraint, and whether \
  the page feels modern and trustworthy based on available cues. Use animation_density \
  as a quality cue: "low" with hover feedback and scroll animations is better than \
  "high" density with no purposeful interaction feedback. Presence of animations alone \
  does not equal quality.
- ux: CTA clarity, friction, forms, navigation simplicity, accessibility hints, \
  whether a primary CTA appears above the fold, whether the hero communicates a clear \
  value proposition, and whether motion likely helps or hurts comprehension and ease \
  of action.
- seo: search discoverability basics such as titles, meta descriptions, and semantic \
  structure. SEO matters, but it should not dominate the final judgment.

JSON schema:
{
  "overallScore": <number 0-100>,
  "content": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "structure": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "design": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "ux": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "seo": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  }
}
"""

_REPAIR_SYSTEM_PROMPT = """\
You repair malformed model outputs into valid JSON.

Rules:
- Return ONLY one valid JSON object and nothing else.
- The JSON must match the exact schema provided.
- Preserve the original analysis intent when possible.
- If the malformed response is incomplete, infer conservatively from the original page data.
- Use the same scoring philosophy: modern UX, conversion clarity, design quality, and \
  purposeful motion matter more than SEO alone.
- Keep 1 to 2 actionable suggestions per section, each under 200 characters.
- Do not include markdown, explanations, or code fences.

JSON schema:
{
  "overallScore": <number 0-100>,
  "content": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "structure": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "design": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "ux": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  },
  "seo": {
    "score": <number 0-100>,
    "suggestions": ["<string>"]
  }
}
"""


def _build_user_prompt(data: ScrapedPageData, compact: bool = False) -> str:
    """Build a deterministic user prompt from scraped data."""
    ds = data.design_signals
    ex = data.experience_signals

    if compact:
        sections = [
            "Compact analysis mode: prioritize concise scoring output.",
            f"URL: {data.url}",
            f"Title: {data.title or '(missing)'}",
            f"Meta description: {data.meta_description or '(missing)'}",
            f"H1 headings: {', '.join(data.h1_headings[:2]) or '(none)'}",
            f"H2 headings: {', '.join(data.h2_headings[:3]) or '(none)'}",
            f"Has animations: {ds.has_animations}",
            f"Animation libraries: {', '.join(ds.detected_libraries[:3]) or '(none)'}",
            (
                "Animation quality: "
                f"density={ds.animation_density}, hover_feedback={ds.has_hover_feedback}, "
                f"scroll_animations={ds.has_scroll_animations}"
            ),
            f"Media counts: images={ds.image_count}, videos={ds.video_count}",
            (
                "Core UX signals: "
                f"buttons={ex.button_count}, ctas={ex.cta_count}, forms={ex.form_count}, "
                f"inputs={ex.input_count}, nav_links={ex.nav_link_count}"
            ),
            (
                "Hero signals: "
                f"cta_above_fold={ex.has_primary_cta_above_fold}, "
                f"hero_text_length={ex.hero_text_length}, "
                f"clear_value_prop={ex.has_clear_value_prop}"
            ),
            (
                "Trust and conversion signals: "
                f"pricing={ex.has_pricing_section}, social_proof={ex.has_social_proof}, "
                f"faq={ex.has_faq_section}"
            ),
            (
                "Accessibility signals: "
                f"reduced_motion={ex.has_reduced_motion_support}, skip_link={ex.has_skip_link}"
            ),
            f"CTA text samples: {', '.join(ex.cta_text_samples[:3]) or '(none)'}",
            (
                "Visible text excerpt: "
                f"{_truncate_prompt_text(data.visible_text_excerpt, _COMPACT_VISIBLE_TEXT_CHARS) or '(missing)'}"
            ),
        ]
    else:
        sections = [
            f"URL: {data.url}",
            f"Title: {data.title or '(missing)'}",
            f"Meta description: {data.meta_description or '(missing)'}",
            f"H1 headings: {', '.join(data.h1_headings) or '(none)'}",
            f"H2 headings: {', '.join(data.h2_headings) or '(none)'}",
            f"Has animations: {ds.has_animations}",
            f"Animation keyword count: {ds.animation_keyword_count}",
            f"Animation density: {ds.animation_density}",
            f"Has animation library: {ds.has_animation_library}",
            f"Detected libraries: {', '.join(ds.detected_libraries) or '(none)'}",
            f"Has hover feedback: {ds.has_hover_feedback}",
            f"Has scroll animations: {ds.has_scroll_animations}",
            f"Image count: {ds.image_count}",
            f"Video count: {ds.video_count}",
            f"Button count: {ex.button_count}",
            f"CTA count: {ex.cta_count}",
            f"CTA text samples: {', '.join(ex.cta_text_samples) or '(none)'}",
            f"Form count: {ex.form_count}",
            f"Input count: {ex.input_count}",
            f"Nav link count: {ex.nav_link_count}",
            f"Has primary CTA above fold: {ex.has_primary_cta_above_fold}",
            f"Hero text length: {ex.hero_text_length}",
            f"Has clear value proposition: {ex.has_clear_value_prop}",
            f"Has pricing section: {ex.has_pricing_section}",
            f"Has social proof: {ex.has_social_proof}",
            f"Has FAQ section: {ex.has_faq_section}",
            f"Has reduced motion support: {ex.has_reduced_motion_support}",
            f"Has skip link: {ex.has_skip_link}",
            (
                "Visible text excerpt: "
                f"{_truncate_prompt_text(data.visible_text_excerpt) or '(missing)'}"
            ),
        ]

    return "Analyze this landing page:\n\n" + "\n".join(sections)


def _truncate_prompt_text(value: str | None, max_chars: int = _MAX_VISIBLE_TEXT_CHARS) -> str | None:
    if not value:
        return None

    compact = " ".join(value.split())
    return compact[:max_chars].strip() or None


def _build_repair_prompt(
    user_prompt: str,
    raw_text: str | None,
    error_reason: str,
) -> str:
    malformed = (raw_text or "(empty response)").strip()
    if len(malformed) > _MAX_REPAIR_SOURCE_CHARS:
        malformed = malformed[:_MAX_REPAIR_SOURCE_CHARS].rstrip()

    return (
        "Original page data:\n"
        f"{user_prompt}\n\n"
        "Malformed model response:\n"
        f"{malformed}\n\n"
        f"Parsing failure: {error_reason}\n\n"
        "Repair this into valid JSON that matches the schema exactly."
    )


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


def _extract_finish_metadata(response: Any) -> tuple[str | None, str | None]:
    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        return (None, None)

    candidate = candidates[0]
    finish_reason = getattr(candidate, "finish_reason", None)
    finish_message = getattr(candidate, "finish_message", None)

    if finish_reason is not None and hasattr(finish_reason, "name"):
        finish_reason = finish_reason.name
    elif finish_reason is not None:
        finish_reason = str(finish_reason)

    return (finish_reason, finish_message)


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

    if len(cleaned) > _MAX_SUGGESTIONS_PER_SECTION:
        cleaned = cleaned[:_MAX_SUGGESTIONS_PER_SECTION]

    return cleaned


def _normalize_score(score: float) -> float:
    return round(max(0.0, min(100.0, score)), 1)


def _normalize_section(name: str, section: AISectionResult) -> None:
    if not isinstance(section.score, (int, float)) or math.isnan(section.score):
        AI_ERRORS.labels(reason="invalid_score").inc()
        raise AIAnalysisError(
            f"AI returned invalid score for {name}: {section.score!r}"
        )
    section.score = _normalize_score(section.score)
    section.suggestions = _normalize_suggestions(section.suggestions)

    if len(section.suggestions) < _MIN_SUGGESTIONS_PER_SECTION:
        AI_ERRORS.labels(reason="insufficient_suggestions").inc()
        raise AIAnalysisError(
            f"AI returned only {len(section.suggestions)} suggestion(s) for {name}, "
            f"expected at least {_MIN_SUGGESTIONS_PER_SECTION}"
        )


def _validate_ai_payload(payload: Any) -> AIAnalysisResult:
    """Validate and normalize an AI payload."""
    try:
        result = AIAnalysisResult.model_validate(payload)
    except ValidationError as exc:
        AI_ERRORS.labels(reason="schema_error").inc()
        raise AIAnalysisError(f"AI response does not match schema: {exc}") from exc

    result.overallScore = _normalize_score(result.overallScore)
    _normalize_section("content", result.content)
    _normalize_section("structure", result.structure)
    _normalize_section("design", result.design)
    _normalize_section("ux", result.ux)
    _normalize_section("seo", result.seo)

    return result


def _parse_ai_response(
    raw_text: str | None,
    parsed_payload: Any | None = None,
) -> AIAnalysisResult:
    """Parse and validate the AI output into a typed result."""
    if parsed_payload is not None:
        try:
            return _validate_ai_payload(parsed_payload)
        except AIAnalysisError:
            logger.debug("ai_parsed_payload_invalid")

    if not raw_text:
        AI_ERRORS.labels(reason="empty_response").inc()
        raise AIAnalysisError("AI returned an empty response")

    json_str = _extract_json(raw_text)

    try:
        payload = json.loads(json_str)
    except json.JSONDecodeError:
        # Fast deterministic repair before falling back to expensive LLM repair
        try:
            repaired_str = repair_json(json_str, return_objects=False)
            payload = json.loads(repaired_str)
            logger.info("ai_json_repaired_locally", original_len=len(json_str))
        except Exception as repair_exc:
            AI_ERRORS.labels(reason="parse_error").inc()
            logger.debug("ai_json_parse_failed", raw_text=raw_text[:500])
            raise AIAnalysisError(
                f"AI returned invalid JSON: {repair_exc}"
            ) from repair_exc

    try:
        return _validate_ai_payload(payload)
    except AIAnalysisError:
        logger.debug("ai_schema_mismatch", raw_text=raw_text[:500])
        raise


def _build_generation_config(
    system_instruction: str,
    max_output_tokens: int = _MAX_OUTPUT_TOKENS,
) -> genai.types.GenerateContentConfig:
    return genai.types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=_TEMPERATURE,
        max_output_tokens=max_output_tokens,
        response_mime_type="application/json",
        response_schema=AIAnalysisResult,
    )


async def _repair_ai_response(
    client: genai.Client,
    user_prompt: str,
    raw_text: str | None,
    error_reason: str,
) -> AIAnalysisResult | None:
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=_MODEL_NAME,
                contents=_build_repair_prompt(user_prompt, raw_text, error_reason),
                config=_build_generation_config(_REPAIR_SYSTEM_PROMPT),
            ),
            timeout=_REPAIR_REQUEST_TIMEOUT_SECONDS,
        )
    except Exception:
        return None

    try:
        return _parse_ai_response(
            getattr(response, "text", None),
            getattr(response, "parsed", None),
        )
    except AIAnalysisError:
        return None


async def _generate_ai_response(
    client: genai.Client,
    user_prompt: str,
    max_output_tokens: int = _MAX_OUTPUT_TOKENS,
) -> Any:
    return await asyncio.wait_for(
        client.aio.models.generate_content(
            model=_MODEL_NAME,
            contents=user_prompt,
            config=_build_generation_config(
                _SYSTEM_PROMPT,
                max_output_tokens=max_output_tokens,
            ),
        ),
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )


def _should_try_compact_retry(finish_reason: str | None, error_reason: str) -> bool:
    return finish_reason == "MAX_TOKENS" or "invalid json" in error_reason.lower()


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
    compact_user_prompt = _build_user_prompt(scraped_data, compact=True)
    log = logger.bind(url=scraped_data.url)
    log.info("ai_analysis_started")

    last_error: AIAnalysisError | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        attempt_start = time.perf_counter()
        try:
            response = await _generate_ai_response(client, user_prompt)
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
            raise AIAnalysisError(f"API request failed: {exc}") from exc

        raw_text = getattr(response, "text", None)
        parsed_payload = getattr(response, "parsed", None)
        finish_reason, finish_message = _extract_finish_metadata(response)
        AI_DURATION.observe(time.perf_counter() - attempt_start)
        if not raw_text and parsed_payload is None:
            AI_ERRORS.labels(reason="empty_response").inc()
            last_error = AIAnalysisError("AI returned an empty response")
            log.warning(
                "ai_empty_response",
                attempt=attempt,
                max_retries=_MAX_RETRIES,
                finish_reason=finish_reason,
                finish_message=finish_message,
            )
            if attempt < _MAX_RETRIES:
                AI_RETRIES.inc()
            continue

        log.debug(
            "ai_raw_response",
            attempt=attempt,
            response=(raw_text or "")[:500],
            parsed_available=parsed_payload is not None,
            finish_reason=finish_reason,
        )

        try:
            result = _parse_ai_response(raw_text, parsed_payload)
            AI_SCORES.observe(result.overallScore)
            log.info(
                "ai_analysis_completed",
                attempt=attempt,
                repaired=False,
                score=result.overallScore,
                suggestion_count=(
                    len(result.content.suggestions)
                    + len(result.structure.suggestions)
                    + len(result.design.suggestions)
                    + len(result.ux.suggestions)
                    + len(result.seo.suggestions)
                ),
            )
            return result
        except AIAnalysisError as exc:
            if _should_try_compact_retry(finish_reason, exc.reason):
                try:
                    compact_response = await _generate_ai_response(
                        client,
                        compact_user_prompt,
                        max_output_tokens=_COMPACT_MAX_OUTPUT_TOKENS,
                    )
                    compact_result = _parse_ai_response(
                        getattr(compact_response, "text", None),
                        getattr(compact_response, "parsed", None),
                    )
                    AI_SCORES.observe(compact_result.overallScore)
                    log.info(
                        "ai_analysis_completed",
                        attempt=attempt,
                        repaired=False,
                        compact_retry=True,
                        score=compact_result.overallScore,
                        suggestion_count=(
                            len(compact_result.content.suggestions)
                            + len(compact_result.structure.suggestions)
                            + len(compact_result.design.suggestions)
                            + len(compact_result.ux.suggestions)
                            + len(compact_result.seo.suggestions)
                        ),
                    )
                    return compact_result
                except (AIAnalysisError, asyncio.TimeoutError):
                    log.debug(
                        "ai_compact_retry_failed",
                        attempt=attempt,
                        finish_reason=finish_reason,
                    )
                except Exception as compact_exc:
                    log.debug(
                        "ai_compact_retry_error",
                        attempt=attempt,
                        finish_reason=finish_reason,
                        error=str(compact_exc),
                    )

            repaired_result = await _repair_ai_response(
                client=client,
                user_prompt=user_prompt,
                raw_text=raw_text,
                error_reason=exc.reason,
            )
            if repaired_result is not None:
                AI_SCORES.observe(repaired_result.overallScore)
                log.info(
                    "ai_analysis_completed",
                    attempt=attempt,
                    repaired=True,
                    score=repaired_result.overallScore,
                    suggestion_count=(
                        len(repaired_result.content.suggestions)
                        + len(repaired_result.structure.suggestions)
                        + len(repaired_result.design.suggestions)
                        + len(repaired_result.ux.suggestions)
                        + len(repaired_result.seo.suggestions)
                    ),
                )
                return repaired_result

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
