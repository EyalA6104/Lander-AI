"""Middleware that logs every HTTP request/response with timing.

Emits structured log lines for:
- request start (INFO)
- response completion with duration_ms (INFO, or WARNING if slow)

Skips noisy paths like /metrics and /health to keep logs actionable.
"""

from __future__ import annotations

import os
import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.stdlib.get_logger("http")

_SLOW_THRESHOLD_MS = int(os.getenv("SLOW_REQUEST_THRESHOLD_MS", "5000"))
_SKIP_PATHS: frozenset[str] = frozenset({"/metrics", "/health"})


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in _SKIP_PATHS:
            return await call_next(request)

        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            user_agent=request.headers.get("user-agent", ""),
        )

        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        log = logger.warning if duration_ms >= _SLOW_THRESHOLD_MS else logger.info
        log(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

        return response
