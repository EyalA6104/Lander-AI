import re

from bs4 import BeautifulSoup, Tag

from app.services.extractors.models import ExperienceSignals

_CTA_PATTERN = re.compile(
    r"\b("
    r"get started|start free|free trial|try for free|book demo|request demo|"
    r"schedule demo|contact sales|sign up|join now|subscribe|buy now|"
    r"see pricing|view pricing|learn more|talk to sales|request access"
    r")\b",
    re.IGNORECASE,
)
_PRICING_PATTERN = re.compile(
    r"\b(pricing|plans|compare plans|subscription|monthly|annual)\b",
    re.IGNORECASE,
)
_SOCIAL_PROOF_PATTERN = re.compile(
    r"\b(testimonial|testimonials|reviews|trusted by|customers|customer stories|"
    r"case study|case studies|used by|rated|g2|capterra)\b",
    re.IGNORECASE,
)
_FAQ_PATTERN = re.compile(
    r"\b(faq|frequently asked questions)\b",
    re.IGNORECASE,
)
_SKIP_LINK_PATTERN = re.compile(
    r"\bskip to (content|main content|navigation)\b",
    re.IGNORECASE,
)
_BUTTON_INPUT_TYPES = {"button", "submit", "reset"}
_MAX_CTA_SAMPLES = 5
_ABOVE_FOLD_RATIO = 0.30
_HERO_CONTAINERS = {"section", "header", "div", "main", "article"}
_MIN_VALUE_PROP_LENGTH = 40


class ExperienceSignalsExtractor:
    """Extract low-cost UX, conversion, and accessibility signals."""

    def extract(self, soup: BeautifulSoup) -> ExperienceSignals:
        button_count = 0
        cta_count = 0
        cta_samples: list[str] = []

        for tag in soup.find_all(["button", "a", "input"]):
            if not isinstance(tag, Tag):
                continue

            text = _get_interactive_text(tag)
            is_button_like = _is_button_like(tag)

            if is_button_like:
                button_count += 1

            if text and _CTA_PATTERN.search(text):
                cta_count += 1
                if text not in cta_samples:
                    cta_samples.append(text)

        form_count = len(soup.find_all("form"))
        input_count = len(soup.find_all(["input", "textarea", "select"]))
        nav_link_count = sum(len(nav.find_all("a")) for nav in soup.find_all("nav"))

        document_text = soup.get_text(" ", strip=True)
        style_text = " ".join(style.get_text(" ", strip=True) for style in soup.find_all("style"))
        script_text = " ".join(script.get_text(" ", strip=True) for script in soup.find_all("script"))
        behavior_text = f"{document_text} {style_text} {script_text}"

        has_skip_link = any(
            _SKIP_LINK_PATTERN.search(link.get_text(" ", strip=True) or "")
            for link in soup.find_all("a", href=True)
        )
        has_reduced_motion_support = "prefers-reduced-motion" in behavior_text.lower()

        hero_text_length, has_clear_value_prop = _extract_hero_signals(soup)
        has_primary_cta_above_fold = _has_cta_above_fold(soup)

        return ExperienceSignals(
            button_count=button_count,
            cta_count=cta_count,
            cta_text_samples=cta_samples[:_MAX_CTA_SAMPLES],
            form_count=form_count,
            input_count=input_count,
            nav_link_count=nav_link_count,
            has_pricing_section=bool(_PRICING_PATTERN.search(document_text)),
            has_social_proof=bool(_SOCIAL_PROOF_PATTERN.search(document_text)),
            has_faq_section=bool(_FAQ_PATTERN.search(document_text)),
            has_reduced_motion_support=has_reduced_motion_support,
            has_skip_link=has_skip_link,
            has_primary_cta_above_fold=has_primary_cta_above_fold,
            hero_text_length=hero_text_length,
            has_clear_value_prop=has_clear_value_prop,
        )


def _is_button_like(tag: Tag) -> bool:
    if tag.name == "button":
        return True

    if tag.name == "a":
        role = (tag.get("role", "") or "").strip().lower()
        classes = " ".join(tag.get("class", []))
        return role == "button" or "btn" in classes.lower() or "button" in classes.lower()

    if tag.name == "input":
        input_type = (tag.get("type", "") or "").strip().lower()
        return input_type in _BUTTON_INPUT_TYPES

    return False


def _get_interactive_text(tag: Tag) -> str:
    text = tag.get_text(" ", strip=True)
    if text:
        return _normalize_text(text)

    for attr_name in ("aria-label", "value", "title"):
        value = (tag.get(attr_name, "") or "").strip()
        if value:
            return _normalize_text(value)

    return ""


def _normalize_text(value: str) -> str:
    return " ".join(value.split())


def _has_cta_above_fold(soup: BeautifulSoup) -> bool:
    """True if a CTA-like interactive element appears in the first ~30% of body children."""
    body = soup.find("body")
    if not body or not isinstance(body, Tag):
        return False

    children = [c for c in body.children if isinstance(c, Tag)]
    if not children:
        return False

    cutoff = max(1, int(len(children) * _ABOVE_FOLD_RATIO))
    above_fold = children[:cutoff]

    for container in above_fold:
        for tag in container.find_all(["button", "a", "input"]):
            if not isinstance(tag, Tag):
                continue
            text = _get_interactive_text(tag)
            if text and _CTA_PATTERN.search(text):
                return True
            if _is_button_like(tag) and text:
                return True
    return False


def _extract_hero_signals(soup: BeautifulSoup) -> tuple[int, bool]:
    """Return (hero_text_length, has_clear_value_prop)."""
    h1 = soup.find("h1")
    if not h1 or not isinstance(h1, Tag):
        return (0, False)

    h1_text = h1.get_text(" ", strip=True)

    container = h1.parent
    while container and isinstance(container, Tag):
        if container.name in _HERO_CONTAINERS:
            break
        container = container.parent

    if not container or not isinstance(container, Tag):
        return (len(h1_text), False)

    hero_text = container.get_text(" ", strip=True)
    hero_text_length = len(hero_text)

    has_value_prop = False
    for p in container.find_all("p"):
        if isinstance(p, Tag) and len(p.get_text(" ", strip=True)) >= _MIN_VALUE_PROP_LENGTH:
            has_value_prop = True
            break

    return (hero_text_length, has_value_prop)
