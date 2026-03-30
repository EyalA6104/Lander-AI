import asyncio
import json
import time
from collections import defaultdict
from urllib.parse import urlparse

import structlog
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.metrics import RATE_LIMIT_BLOCKED

logger = structlog.stdlib.get_logger("rate_limiter")

_RATE_LIMIT_RESPONSE = {
    "status": "error",
    "error": "Too many requests. Please wait a moment and try again.",
    "data": None,
}

_TARGET_PATH = "/analyze"
_MAX_REQUESTS = 10
_WINDOW_SECONDS = 60
_DUPLICATE_WINDOW_SECONDS = 5
_CLEANUP_INTERVAL_SECONDS = 120


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limiter applied only to the /analyze endpoint.

    Also rejects duplicate requests (same IP + same URL) within a short window
    to avoid redundant AI/scraper work.
    """

    def __init__(self, app):
        super().__init__(app)
        self._request_log: dict[str, list[float]] = defaultdict(list)
        self._recent_urls: dict[str, float] = {}
        self._last_cleanup: float = time.monotonic()
        self._lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if request.url.path != _TARGET_PATH or request.method != "POST":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.monotonic()

        body = await request.body()
        url = self._normalize_url(self._extract_url(body))

        async with self._lock:
            self._maybe_cleanup(now)

            timestamps = self._request_log[client_ip]
            cutoff = now - _WINDOW_SECONDS
            timestamps[:] = [t for t in timestamps if t > cutoff]

            if len(timestamps) >= _MAX_REQUESTS:
                RATE_LIMIT_BLOCKED.labels(reason="limit_exceeded").inc()
                logger.warning("rate_limit_exceeded", client_ip=client_ip)
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content=_RATE_LIMIT_RESPONSE,
                )

            if url:
                dup_key = f"{client_ip}|{url}"
                last_time = self._recent_urls.get(dup_key)
                if last_time is not None and (now - last_time) < _DUPLICATE_WINDOW_SECONDS:
                    RATE_LIMIT_BLOCKED.labels(reason="duplicate_request").inc()
                    logger.warning(
                        "duplicate_request_blocked", client_ip=client_ip, url=url
                    )
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content=_RATE_LIMIT_RESPONSE,
                    )
                self._recent_urls[dup_key] = now

            timestamps.append(now)

        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # First entry is the original client; proxies append themselves.
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"

    def _maybe_cleanup(self, now: float) -> None:
        """Periodically purge stale tracking data to bound memory usage."""
        if now - self._last_cleanup < _CLEANUP_INTERVAL_SECONDS:
            return
        self._last_cleanup = now

        window_cutoff = now - _WINDOW_SECONDS
        stale_ips = [
            ip
            for ip, ts in self._request_log.items()
            if not ts or ts[-1] <= window_cutoff
        ]
        for ip in stale_ips:
            del self._request_log[ip]

        dup_cutoff = now - _DUPLICATE_WINDOW_SECONDS
        stale_keys = [
            k for k, t in self._recent_urls.items() if t <= dup_cutoff
        ]
        for k in stale_keys:
            del self._recent_urls[k]

    @staticmethod
    def _extract_url(body: bytes) -> str:
        try:
            payload = json.loads(body)
            return payload.get("url", "")
        except (json.JSONDecodeError, AttributeError):
            return ""

    @staticmethod
    def _normalize_url(raw: str) -> str:
        """Normalize a URL so logically identical addresses share a key."""
        if not raw:
            return ""
        parsed = urlparse(raw)
        scheme = (parsed.scheme or "https").lower()
        host = (parsed.hostname or "").lower()
        port = f":{parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
        path = parsed.path.rstrip("/") or ""
        query = f"?{parsed.query}" if parsed.query else ""
        return f"{scheme}://{host}{port}{path}{query}"
