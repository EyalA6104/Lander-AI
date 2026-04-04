import time

import structlog
from fastapi import APIRouter

from app.core.metrics import ANALYZE_DURATION, ANALYZE_REQUESTS
from app.services.ai_analysis import analyze_with_ai, AIAnalysisError
from app.schemas.analysis import (
    AnalysisData,
    AnalyzeRequest,
    AnalyzeResponse,
    ContentAnalysis,
    DesignAnalysis,
    SEOAnalysis,
    StructureAnalysis,
    UXAnalysis,
)
from app.services.scoring import compute_overall_score
from app.services.url_validator import validate_url, URLValidationError
from app.services.response_cache import response_cache, normalize_cache_key
from app.services.scraper import ScraperError, scrape_page

logger = structlog.stdlib.get_logger("analyze")

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a landing page URL: scrape -> AI analysis -> structured response."""
    raw_url = request.url
    log = logger.bind(url=raw_url)

    try:
        url = validate_url(raw_url)
    except URLValidationError as exc:
        log.warning("url_validation_failed", reason=exc.reason)
        ANALYZE_REQUESTS.labels(status="error").inc()
        return AnalyzeResponse(
            status="error",
            data=None,
            error=exc.reason,
        )

    cache_key = normalize_cache_key(url)

    cached = await response_cache.get(cache_key)
    if cached is not None:
        log.info("analyze_cache_hit")
        ANALYZE_REQUESTS.labels(status=cached.status).inc()
        return cached

    key_lock = await response_cache.acquire_key_lock(cache_key)
    async with key_lock:
        cached = await response_cache.get(cache_key)
        if cached is not None:
            ANALYZE_REQUESTS.labels(status=cached.status).inc()
            return cached

        pipeline_start = time.perf_counter()
        response = await _run_pipeline(url)
        ANALYZE_DURATION.observe(time.perf_counter() - pipeline_start)
        ANALYZE_REQUESTS.labels(status=response.status).inc()

        await response_cache.put(cache_key, response)
        log.info("analyze_completed", status=response.status)
        return response


async def _run_pipeline(url: str) -> AnalyzeResponse:
    """Execute the scrape -> AI analysis pipeline and build the response."""
    log = logger.bind(url=url)

    try:
        scraped = await scrape_page(url)
    except ScraperError as exc:
        log.warning("pipeline_scrape_failed", reason=exc.reason)
        reason_lower = exc.reason.lower()

        if "time" in reason_lower or "connection" in reason_lower or "50" in reason_lower:
            msg = f"Network issue: Failed to fetch the page. Try again in a few seconds. ({exc.reason})"
        else:
            msg = f"Failed to fetch the page. Please ensure the URL is correct and publicly accessible. ({exc.reason})"

        return AnalyzeResponse(
            status="error",
            data=None,
            error=msg,
        )

    try:
        ai_result = await analyze_with_ai(scraped)
        status_val = "success"
        err_val = None
    except AIAnalysisError as exc:
        log.warning("pipeline_ai_failed", reason=exc.reason)
        ai_result = None
        status_val = "partial"

        reason_lower = exc.reason.lower()
        if "429" in reason_lower or "time" in reason_lower or "failed" in reason_lower or "quota" in reason_lower:
            err_val = f"AI analysis is temporarily unavailable. Try again in a few seconds. Partial page data is shown below. ({exc.reason})"
        else:
            err_val = f"AI analysis failed. Partial page data is shown below. ({exc.reason})"

    if ai_result is not None:
        computed_score = compute_overall_score(
            content=ai_result.content.score,
            ux=ai_result.ux.score,
            design=ai_result.design.score,
            structure=ai_result.structure.score,
            seo=ai_result.seo.score,
        )
        log.info(
            "scoring_summary",
            ai_overall=ai_result.overallScore,
            computed_overall=computed_score,
            delta=round(ai_result.overallScore - computed_score, 1),
            content=ai_result.content.score,
            ux=ai_result.ux.score,
            design=ai_result.design.score,
            structure=ai_result.structure.score,
            seo=ai_result.seo.score,
        )
    else:
        computed_score = None

    data = AnalysisData(
        url=scraped.url,
        content=ContentAnalysis(
            title=scraped.title,
            meta_description=scraped.meta_description,
            score=ai_result.content.score if ai_result else None,
            suggestions=ai_result.content.suggestions if ai_result else [],
        ),
        structure=StructureAnalysis(
            h1_headings=scraped.h1_headings,
            h2_headings=scraped.h2_headings,
            score=ai_result.structure.score if ai_result else None,
            suggestions=ai_result.structure.suggestions if ai_result else [],
        ),
        design=DesignAnalysis(
            signals=scraped.design_signals,
            score=ai_result.design.score if ai_result else None,
            suggestions=ai_result.design.suggestions if ai_result else [],
        ),
        ux=UXAnalysis(
            score=ai_result.ux.score if ai_result else None,
            suggestions=ai_result.ux.suggestions if ai_result else [],
        ),
        seo=SEOAnalysis(
            score=ai_result.seo.score if ai_result else None,
            suggestions=ai_result.seo.suggestions if ai_result else [],
        ),
        overall_score=computed_score,
    )

    return AnalyzeResponse(status=status_val, data=data, error=err_val)
