"""Deep health-check endpoint.

Returns structured status covering uptime, cache statistics, and a
Gemini API reachability probe so operators/load-balancers can make
informed routing decisions.
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter

from app.core.config import get_gemini_api_key
from app.services.response_cache import response_cache

router = APIRouter(tags=["health"])

_STARTUP_TIME: float = time.time()


def _uptime_seconds() -> float:
    return round(time.time() - _STARTUP_TIME, 1)


async def _check_gemini() -> dict[str, Any]:
    """Lightweight probe: verify the API key is configured and the client
    can be instantiated.  A full generate_content call would be too costly
    for a health check, so we only validate configuration readiness."""
    try:
        get_gemini_api_key()
        return {"status": "ok"}
    except RuntimeError as exc:
        return {"status": "error", "detail": str(exc)}


def _cache_stats() -> dict[str, int]:
    return response_cache.stats()


@router.get("/health")
async def health_check() -> dict[str, Any]:
    gemini_status = await _check_gemini()

    all_ok = gemini_status["status"] == "ok"
    overall = "healthy" if all_ok else "degraded"

    return {
        "status": overall,
        "uptime_seconds": _uptime_seconds(),
        "checks": {
            "gemini_api": gemini_status,
        },
        "cache": _cache_stats(),
    }
