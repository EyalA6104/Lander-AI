import time

import structlog
from bs4 import BeautifulSoup
from pydantic import BaseModel

from app.core.metrics import (
    SCRAPER_DURATION,
    SCRAPER_ERRORS,
    SCRAPER_PAGE_SIZE_BYTES,
)
from app.services.extractors import (
    ContentExtractor,
    DesignSignals,
    DesignSignalsExtractor,
    ExperienceSignals,
    ExperienceSignalsExtractor,
    StructureExtractor,
)
from app.services.renderer import RendererError, render_page

logger = structlog.stdlib.get_logger("scraper")


# ---------------------------------------------------------------------------
# Core models & errors
# ---------------------------------------------------------------------------

class ScrapedPageData(BaseModel):
    url: str
    title: str | None = None
    meta_description: str | None = None
    h1_headings: list[str]
    h2_headings: list[str]
    design_signals: DesignSignals
    experience_signals: ExperienceSignals
    visible_text_excerpt: str | None = None


class ScraperError(Exception):
    """Raised when scraping a page fails."""

    def __init__(self, url: str, reason: str) -> None:
        self.url = url
        self.reason = reason
        super().__init__(f"Failed to scrape {url}: {reason}")


# ---------------------------------------------------------------------------
# Extractors (instantiated once, stateless)
# ---------------------------------------------------------------------------

_content_extractor = ContentExtractor()
_structure_extractor = StructureExtractor()
_design_signals_extractor = DesignSignalsExtractor()
_experience_signals_extractor = ExperienceSignalsExtractor()
_VISIBLE_TEXT_EXCERPT_CHARS = 2800
_MIN_FRAGMENT_LENGTH = 3


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def scrape_page(url: str) -> ScrapedPageData:
    """Render a page by URL and extract structured data.

    Args:
        url: The full URL of the page to scrape.

    Returns:
        ScrapedPageData with title, meta description, headings, and AI prompt signals.

    Raises:
        ScraperError: If rendering fails.
    """
    log = logger.bind(url=url)
    log.info("scrape_started")
    start = time.perf_counter()

    try:
        rendered = await render_page(url)
    except RendererError as exc:
        _record_renderer_error(exc)
        raise ScraperError(url, _map_renderer_reason(exc)) from exc

    page_size = len(rendered.html.encode("utf-8"))
    SCRAPER_PAGE_SIZE_BYTES.observe(page_size)

    soup = BeautifulSoup(rendered.html, "html.parser")

    content = _content_extractor.extract(soup)
    structure = _structure_extractor.extract(soup)
    design = _design_signals_extractor.extract(soup)
    experience = _experience_signals_extractor.extract(soup)

    title = content.title
    if not title and rendered.title:
        title = rendered.title.strip() or None

    result = ScrapedPageData(
        url=url,
        title=title,
        meta_description=content.meta_description,
        h1_headings=structure.h1_headings,
        h2_headings=structure.h2_headings,
        design_signals=design,
        experience_signals=experience,
        visible_text_excerpt=_build_visible_text_excerpt(rendered.visible_text),
    )

    duration = time.perf_counter() - start
    SCRAPER_DURATION.observe(duration)

    log.info(
        "scrape_completed",
        duration_ms=round(duration * 1000, 1),
        page_size_bytes=page_size,
        title=result.title,
    )
    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _record_renderer_error(exc: RendererError) -> None:
    if exc.category == "timeout":
        SCRAPER_ERRORS.labels(reason="timeout").inc()
        return

    if exc.category == "invalid_url":
        SCRAPER_ERRORS.labels(reason="invalid_url").inc()
        return

    SCRAPER_ERRORS.labels(reason="connection").inc()


def _map_renderer_reason(exc: RendererError) -> str:
    if exc.category == "timeout":
        return "Request timed out"

    if exc.category == "invalid_url":
        return "Invalid URL format"

    return "Failed to fetch the page"


def _build_visible_text_excerpt(visible_text: str | None) -> str | None:
    if not visible_text:
        return None

    lines = visible_text.splitlines()

    cleaned: list[str] = []
    prev = ""
    for raw_line in lines:
        collapsed = " ".join(raw_line.split())
        if len(collapsed) < _MIN_FRAGMENT_LENGTH:
            continue
        if collapsed == prev:
            continue
        prev = collapsed
        cleaned.append(collapsed)

    excerpt = " ".join(cleaned)
    if len(excerpt) > _VISIBLE_TEXT_EXCERPT_CHARS:
        truncated = excerpt[:_VISIBLE_TEXT_EXCERPT_CHARS]
        last_space = truncated.rfind(" ")
        if last_space > _VISIBLE_TEXT_EXCERPT_CHARS // 2:
            truncated = truncated[:last_space]
        excerpt = truncated

    return excerpt.strip() or None
