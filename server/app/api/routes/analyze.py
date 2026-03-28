import logging

from fastapi import APIRouter

from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, AnalysisData
from app.services.scraper import scrape_page, ScraperError
from app.services.ai_analysis import analyze_with_ai, AIAnalysisError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a landing page URL: scrape → AI analysis → structured response."""
    url = str(request.url)

    try:
        scraped = await scrape_page(url)
    except ScraperError as exc:
        logger.warning("Scraper failed for %s: %s", url, exc.reason)
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
        score = ai_result.score
        suggestions = ai_result.suggestions
        status_val = "success"
        err_val = None
    except AIAnalysisError as exc:
        logger.warning("AI analysis failed for %s: %s", url, exc.reason)
        score = None
        suggestions = []
        status_val = "partial"
        
        reason_lower = exc.reason.lower()
        if "429" in reason_lower or "time" in reason_lower or "failed" in reason_lower or "quota" in reason_lower:
            err_val = f"AI analysis is temporarily unavailable. Try again in a few seconds. Partial page data is shown below. ({exc.reason})"
        else:
            err_val = f"AI analysis failed. Partial page data is shown below. ({exc.reason})"

    data = AnalysisData(
        url=scraped.url,
        title=scraped.title,
        meta_description=scraped.meta_description,
        h1_headings=scraped.h1_headings,
        h2_headings=scraped.h2_headings,
        design_signals=scraped.design_signals,
        score=score,
        suggestions=suggestions,
    )

    return AnalyzeResponse(status=status_val, data=data, error=err_val)
