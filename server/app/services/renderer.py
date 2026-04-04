import asyncio
from dataclasses import dataclass

import structlog
from playwright.async_api import (
    Browser,
    BrowserContext,
    Error as PlaywrightError,
    Page,
    Playwright,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
)

logger = structlog.stdlib.get_logger("renderer")

_NAVIGATION_TIMEOUT_MS = 12_000
_NETWORK_IDLE_TIMEOUT_MS = 3_000
_VISIBLE_TEXT_MAX_CHARS = 20_000
_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

_playwright: Playwright | None = None
_browser: Browser | None = None
_init_lock = asyncio.Lock()


@dataclass(slots=True)
class RenderedPage:
    html: str
    title: str | None
    visible_text: str | None = None


class RendererError(Exception):
    """Raised when rendering a page fails."""

    def __init__(self, category: str, reason: str) -> None:
        self.category = category
        self.reason = reason
        super().__init__(reason)


async def init_renderer() -> None:
    """Launch the shared Playwright browser exactly once."""
    global _playwright, _browser

    if _playwright is not None and _browser is not None:
        return

    async with _init_lock:
        if _playwright is not None and _browser is not None:
            return

        log = logger.bind(browser="chromium")
        log.info("renderer_init_started")
        playwright = await async_playwright().start()

        try:
            browser = await playwright.chromium.launch(headless=True)
        except Exception as exc:
            await playwright.stop()
            log.error("renderer_init_failed", error=str(exc))
            raise RendererError(
                "setup",
                "Failed to initialize the rendering browser.",
            ) from exc

        _playwright = playwright
        _browser = browser
        log.info("renderer_init_completed")


async def close_renderer() -> None:
    """Close the shared browser and Playwright driver."""
    global _playwright, _browser

    async with _init_lock:
        browser = _browser
        playwright = _playwright
        _browser = None
        _playwright = None

        if browser is not None:
            await browser.close()
        if playwright is not None:
            await playwright.stop()

    logger.info("renderer_shutdown_completed")


async def render_page(url: str) -> RenderedPage:
    """Render a URL in a shared browser using an isolated context."""
    await init_renderer()

    browser = _browser
    if browser is None:
        raise RendererError("setup", "Failed to initialize the rendering browser.")

    log = logger.bind(url=url)
    log.info("render_started")

    context: BrowserContext | None = None
    page: Page | None = None

    try:
        context = await browser.new_context(
            user_agent=_USER_AGENT,
            locale="en-US",
        )
        page = await context.new_page()
        page.set_default_timeout(_NAVIGATION_TIMEOUT_MS)
        page.set_default_navigation_timeout(_NAVIGATION_TIMEOUT_MS)

        await page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=_NAVIGATION_TIMEOUT_MS,
        )
        await _wait_for_stable_page(page, log)

        html = await page.content()
        title = await page.title()
        visible_text = await _extract_visible_text(page)

        log.info(
            "render_completed",
            html_size_bytes=len(html.encode("utf-8")),
            title=title or None,
            visible_text_chars=len(visible_text) if visible_text else 0,
        )
        return RenderedPage(
            html=html,
            title=title or None,
            visible_text=visible_text,
        )
    except PlaywrightTimeoutError as exc:
        log.warning("render_timeout")
        raise RendererError("timeout", "Request timed out") from exc
    except PlaywrightError as exc:
        category, reason = _map_playwright_error(exc)
        log.warning("render_failed", category=category, reason=reason)
        raise RendererError(category, reason) from exc
    except Exception as exc:
        log.error("render_failed_unexpected", error=str(exc), exc_info=True)
        raise RendererError("navigation", "Failed to fetch the page") from exc
    finally:
        if page is not None:
            try:
                await page.close()
            except PlaywrightError:
                log.debug("render_page_close_failed")

        if context is not None:
            try:
                await context.close()
            except PlaywrightError:
                log.debug("render_context_close_failed")


async def _wait_for_stable_page(page: Page, log: structlog.BoundLogger) -> None:
    """Wait briefly for late async rendering without hanging forever."""
    try:
        await page.wait_for_load_state(
            "networkidle",
            timeout=_NETWORK_IDLE_TIMEOUT_MS,
        )
    except PlaywrightTimeoutError:
        log.debug(
            "render_networkidle_skipped",
            timeout_ms=_NETWORK_IDLE_TIMEOUT_MS,
        )


async def _extract_visible_text(page: Page) -> str | None:
    text = await page.evaluate(
        """
        () => {
            const value = document.body?.innerText ?? "";
            return value
                .replace(/\\r/g, "")
                .replace(/\\n{3,}/g, "\\n\\n")
                .trim();
        }
        """
    )

    if not isinstance(text, str):
        return None

    bounded = text[:_VISIBLE_TEXT_MAX_CHARS].strip()
    return bounded or None


def _map_playwright_error(exc: PlaywrightError) -> tuple[str, str]:
    message = str(exc).lower()

    if "invalid url" in message:
        return ("invalid_url", "Invalid URL format")

    if any(token in message for token in ("net::", "dns", "name not resolved", "connection")):
        return ("navigation", "Failed to fetch the page")

    return ("navigation", "Failed to fetch the page")
