import asyncio
import time
from urllib.parse import urlparse, urlunparse

import structlog

from app.core.metrics import CACHE_EVICTIONS, CACHE_HITS, CACHE_MISSES, CACHE_SIZE
from app.schemas.analysis import AnalyzeResponse

logger = structlog.stdlib.get_logger("cache")

_TTL_SUCCESS_SECONDS = 600   # 10 minutes
_TTL_PARTIAL_SECONDS = 300   # 5 minutes
_TTL_ERROR_SECONDS = 120     # 2 minutes
_CLEANUP_INTERVAL_SECONDS = 120


def _ttl_for_status(status: str) -> int:
    if status == "success":
        return _TTL_SUCCESS_SECONDS
    if status == "partial":
        return _TTL_PARTIAL_SECONDS
    return _TTL_ERROR_SECONDS


def normalize_cache_key(validated_url: str) -> str:
    """Normalize a **validated** URL into a deterministic cache key.

    Applies: default https scheme, lowercase domain, trailing-slash removal.
    The caller MUST pass a URL that has already gone through ``validate_url``
    — this function does NOT perform security or format validation.
    """
    raw = validated_url.strip()
    if "://" not in raw:
        raw = "https://" + raw

    parsed = urlparse(raw)
    scheme = (parsed.scheme or "https").lower()
    hostname = (parsed.hostname or "").lower()
    port = parsed.port
    path = parsed.path.rstrip("/") or ""
    query = parsed.query
    fragment = ""

    netloc = hostname
    if port and not (
        (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    ):
        netloc = f"{hostname}:{port}"

    return urlunparse((scheme, netloc, path, "", query, fragment))


class _CacheEntry:
    __slots__ = ("response", "created_at", "ttl")

    def __init__(self, response: AnalyzeResponse) -> None:
        self.response = response
        self.created_at = time.monotonic()
        self.ttl = _ttl_for_status(response.status)

    def is_expired(self) -> bool:
        return (time.monotonic() - self.created_at) >= self.ttl


class ResponseCache:
    """Thread-/async-safe in-memory cache for AnalyzeResponse objects."""

    def __init__(self) -> None:
        self._store: dict[str, _CacheEntry] = {}
        self._key_locks: dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()
        self._last_cleanup = time.monotonic()

    async def get(self, key: str) -> AnalyzeResponse | None:
        entry = self._store.get(key)
        if entry is None:
            CACHE_MISSES.inc()
            return None
        if entry.is_expired():
            self._store.pop(key, None)
            self._key_locks.pop(key, None)
            CACHE_MISSES.inc()
            CACHE_SIZE.set(len(self._store))
            return None
        CACHE_HITS.inc()
        logger.info("cache_hit", key=key)
        return entry.response

    async def put(self, key: str, response: AnalyzeResponse) -> None:
        self._store[key] = _CacheEntry(response)
        CACHE_SIZE.set(len(self._store))
        self._maybe_cleanup()

    async def acquire_key_lock(self, key: str) -> asyncio.Lock:
        """Return a per-key lock, creating one if needed.

        The global lock serializes only the dict lookup/creation of per-key
        locks so there's minimal contention for unrelated keys.
        """
        async with self._global_lock:
            lock = self._key_locks.get(key)
            if lock is None:
                lock = asyncio.Lock()
                self._key_locks[key] = lock
            return lock

    def stats(self) -> dict[str, int]:
        """Return cache statistics for the health endpoint."""
        total = len(self._store)
        expired = sum(1 for e in self._store.values() if e.is_expired())
        return {
            "total_entries": total,
            "active_entries": total - expired,
            "expired_entries": expired,
            "pending_locks": len(self._key_locks),
        }

    def _maybe_cleanup(self) -> None:
        now = time.monotonic()
        if (now - self._last_cleanup) < _CLEANUP_INTERVAL_SECONDS:
            return
        self._last_cleanup = now

        expired_keys = [k for k, v in self._store.items() if v.is_expired()]
        for k in expired_keys:
            self._store.pop(k, None)
            self._key_locks.pop(k, None)

        orphan_keys = [
            k for k, lock in self._key_locks.items()
            if k not in self._store and not lock.locked()
        ]
        for k in orphan_keys:
            self._key_locks.pop(k, None)

        removed = len(expired_keys) + len(orphan_keys)
        if removed:
            CACHE_EVICTIONS.inc(len(expired_keys))
            CACHE_SIZE.set(len(self._store))
            logger.info(
                "cache_cleanup",
                expired=len(expired_keys),
                orphan_locks=len(orphan_keys),
                remaining=len(self._store),
            )


response_cache = ResponseCache()
