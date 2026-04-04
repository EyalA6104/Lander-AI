import re

from bs4 import BeautifulSoup, Tag

from app.services.extractors.models import DesignSignals

_ANIMATION_KEYWORDS = re.compile(
    r"animate|animation|transition|fade|slide|zoom|bounce|pulse|motion|parallax",
    re.IGNORECASE,
)

_KNOWN_ANIMATION_LIBS = re.compile(
    r"framer-motion|gsap|animejs|anime\.js|lottie|aos|scroll-reveal"
    r"|scrollreveal|wow\.js|vivus|popmotion|velocity|three\.js",
    re.IGNORECASE,
)

_SCROLL_ANIMATION_LIBS = {"aos", "scroll-reveal", "scrollreveal", "wow.js"}
_SCROLL_ATTR_NAMES = {"data-aos", "data-scroll", "data-sal"}
_SCROLL_CLASS_PATTERN = re.compile(
    r"scroll-animate|on-scroll|scroll-reveal|aos-animate|sal-animate",
    re.IGNORECASE,
)

_HOVER_EFFECT_PATTERN = re.compile(
    r":hover\s*\{[^}]*(transform|opacity|color|background|scale|box-shadow)",
    re.IGNORECASE,
)
_TAILWIND_HOVER_PATTERN = re.compile(
    r"\bhover:(scale|opacity|bg-|text-|shadow|translate|rotate|brightness|ring)",
    re.IGNORECASE,
)


class DesignSignalsExtractor:
    """Detects animation keywords, known libraries, and media elements."""

    def extract(self, soup: BeautifulSoup) -> DesignSignals:
        keyword_hits: set[str] = set()

        for tag in soup.find_all(True):
            if not isinstance(tag, Tag):
                continue

            classes = " ".join(tag.get("class", []))
            style = tag.get("style", "") or ""
            combined = f"{classes} {style}"

            for match in _ANIMATION_KEYWORDS.finditer(combined):
                keyword_hits.add(match.group().lower())

        for style_tag in soup.find_all("style"):
            text = style_tag.get_text()
            for match in _ANIMATION_KEYWORDS.finditer(text):
                keyword_hits.add(match.group().lower())

        detected_libs: set[str] = set()

        for link in soup.find_all("link", rel="stylesheet"):
            href = link.get("href", "") or ""
            for match in _KNOWN_ANIMATION_LIBS.finditer(href):
                detected_libs.add(match.group().lower())

        for script in soup.find_all("script"):
            src = script.get("src", "") or ""
            inline = script.get_text()
            blob = f"{src} {inline}"

            for match in _KNOWN_ANIMATION_LIBS.finditer(blob):
                detected_libs.add(match.group().lower())

        image_count = len(soup.find_all("img"))
        video_count = len(soup.find_all("video"))

        keyword_count = len(keyword_hits)
        animation_density = _bucket_density(keyword_count)
        has_hover_feedback = _detect_hover_feedback(soup)
        has_scroll_animations = _detect_scroll_animations(soup, detected_libs)

        return DesignSignals(
            has_animations=keyword_count > 0,
            animation_keyword_count=keyword_count,
            has_animation_library=len(detected_libs) > 0,
            detected_libraries=sorted(detected_libs),
            image_count=image_count,
            video_count=video_count,
            has_media=(image_count + video_count) > 0,
            animation_density=animation_density,
            has_hover_feedback=has_hover_feedback,
            has_scroll_animations=has_scroll_animations,
        )


def _bucket_density(keyword_count: int) -> str:
    if keyword_count == 0:
        return "none"
    if keyword_count <= 3:
        return "low"
    if keyword_count <= 8:
        return "medium"
    return "high"


def _detect_hover_feedback(soup: BeautifulSoup) -> bool:
    for style_tag in soup.find_all("style"):
        if _HOVER_EFFECT_PATTERN.search(style_tag.get_text()):
            return True

    for tag in soup.find_all(True):
        if not isinstance(tag, Tag):
            continue
        classes = " ".join(tag.get("class", []))
        if _TAILWIND_HOVER_PATTERN.search(classes):
            return True

    return False


def _detect_scroll_animations(soup: BeautifulSoup, detected_libs: set[str]) -> bool:
    if detected_libs & _SCROLL_ANIMATION_LIBS:
        return True

    for script in soup.find_all("script"):
        blob = f"{script.get('src', '') or ''} {script.get_text()}"
        if "scrolltrigger" in blob.lower():
            return True

    for tag in soup.find_all(True):
        if not isinstance(tag, Tag):
            continue
        if any(tag.has_attr(attr) for attr in _SCROLL_ATTR_NAMES):
            return True
        classes = " ".join(tag.get("class", []))
        if _SCROLL_CLASS_PATTERN.search(classes):
            return True

    return False
