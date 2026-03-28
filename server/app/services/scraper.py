import re

import httpx
from bs4 import BeautifulSoup, Tag
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Design-signal detection
# ---------------------------------------------------------------------------

_ANIMATION_KEYWORDS = re.compile(
    r"animate|animation|transition|fade|slide|zoom|bounce|pulse|motion|parallax",
    re.IGNORECASE,
)

_KNOWN_ANIMATION_LIBS = re.compile(
    r"framer-motion|gsap|animejs|anime\.js|lottie|aos|scroll-reveal"
    r"|scrollreveal|wow\.js|vivus|popmotion|velocity|three\.js",
    re.IGNORECASE,
)


class DesignSignals(BaseModel):
    has_animations: bool = False
    animation_keyword_count: int = 0
    has_animation_library: bool = False
    detected_libraries: list[str] = []
    image_count: int = 0
    video_count: int = 0
    has_media: bool = False


def _detect_design_signals(soup: BeautifulSoup) -> DesignSignals:
    """Scan the parsed HTML for lightweight design & animation signals."""

    keyword_hits: set[str] = set()

    # --- Scan class names and inline styles on all elements ----------------
    for tag in soup.find_all(True):
        if not isinstance(tag, Tag):
            continue

        classes = " ".join(tag.get("class", []))
        style = tag.get("style", "") or ""
        combined = f"{classes} {style}"

        for match in _ANIMATION_KEYWORDS.finditer(combined):
            keyword_hits.add(match.group().lower())

    # --- Scan <style> blocks -----------------------------------------------
    for style_tag in soup.find_all("style"):
        text = style_tag.get_text()
        for match in _ANIMATION_KEYWORDS.finditer(text):
            keyword_hits.add(match.group().lower())

    # --- Scan <link> stylesheets for animation-library references ----------
    detected_libs: set[str] = set()

    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "") or ""
        for match in _KNOWN_ANIMATION_LIBS.finditer(href):
            detected_libs.add(match.group().lower())

    # --- Scan <script> tags ------------------------------------------------
    for script in soup.find_all("script"):
        src = script.get("src", "") or ""
        inline = script.get_text()
        blob = f"{src} {inline}"

        for match in _KNOWN_ANIMATION_LIBS.finditer(blob):
            detected_libs.add(match.group().lower())

    # --- Media elements ----------------------------------------------------
    image_count = len(soup.find_all("img"))
    video_count = len(soup.find_all("video"))

    return DesignSignals(
        has_animations=len(keyword_hits) > 0,
        animation_keyword_count=len(keyword_hits),
        has_animation_library=len(detected_libs) > 0,
        detected_libraries=sorted(detected_libs),
        image_count=image_count,
        video_count=video_count,
        has_media=(image_count + video_count) > 0,
    )


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


class ScraperError(Exception):
    """Raised when scraping a page fails."""

    def __init__(self, url: str, reason: str) -> None:
        self.url = url
        self.reason = reason
        super().__init__(f"Failed to scrape {url}: {reason}")


# ---------------------------------------------------------------------------
# HTTP config
# ---------------------------------------------------------------------------

_REQUEST_TIMEOUT = 10.0

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

def _parse_html(html: str, url: str) -> ScrapedPageData:
    """Extract structured data from raw HTML content."""
    soup = BeautifulSoup(html, "html.parser")

    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else None

    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = (
        meta_desc_tag.get("content", "").strip()
        if meta_desc_tag
        else None
    )
    if meta_description == "":
        meta_description = None

    h1_headings = [
        tag.get_text(strip=True)
        for tag in soup.find_all("h1")
        if tag.get_text(strip=True)
    ]

    h2_headings = [
        tag.get_text(strip=True)
        for tag in soup.find_all("h2")
        if tag.get_text(strip=True)
    ]

    design_signals = _detect_design_signals(soup)

    return ScrapedPageData(
        url=url,
        title=title,
        meta_description=meta_description,
        h1_headings=h1_headings,
        h2_headings=h2_headings,
        design_signals=design_signals,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def scrape_page(url: str) -> ScrapedPageData:
    """Fetch a page by URL and extract structured data.

    Args:
        url: The full URL of the page to scrape.

    Returns:
        ScrapedPageData with title, meta description, headings, and design signals.

    Raises:
        ScraperError: If the request fails or the response is not valid HTML.
    """
    try:
        async with httpx.AsyncClient(
            headers=_DEFAULT_HEADERS,
            timeout=_REQUEST_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
    except httpx.TimeoutException:
        raise ScraperError(url, "Request timed out")
    except httpx.InvalidURL:
        raise ScraperError(url, "Invalid URL format")
    except httpx.RequestError as exc:
        raise ScraperError(url, f"Connection error: {exc}")

    if response.status_code != 200:
        raise ScraperError(url, f"HTTP {response.status_code}")

    content_type = response.headers.get("content-type", "")
    if "html" not in content_type:
        raise ScraperError(url, f"Expected HTML but got {content_type}")

    return _parse_html(response.text, url)
