"""Prometheus custom metrics for business-level observability.

Metrics are defined once here and imported by the services that record them.
The ``/metrics`` endpoint is mounted by prometheus-fastapi-instrumentator in
``main.py``; it automatically exposes these alongside the auto-instrumented
HTTP request metrics.
"""

from prometheus_client import Counter, Gauge, Histogram

# ---------------------------------------------------------------------------
# Analysis pipeline
# ---------------------------------------------------------------------------

ANALYZE_REQUESTS = Counter(
    "analyze_requests_total",
    "Total analysis requests by outcome",
    ["status"],  # success | partial | error
)

ANALYZE_DURATION = Histogram(
    "analyze_pipeline_duration_seconds",
    "End-to-end duration of the /analyze pipeline (excludes cache hits)",
    buckets=(0.5, 1, 2, 5, 10, 20, 30, 60),
)

# ---------------------------------------------------------------------------
# Scraper
# ---------------------------------------------------------------------------

SCRAPER_DURATION = Histogram(
    "scraper_duration_seconds",
    "Time to fetch and parse a page",
    buckets=(0.25, 0.5, 1, 2, 5, 10),
)

SCRAPER_ERRORS = Counter(
    "scraper_errors_total",
    "Scraper failures by error category",
    ["reason"],  # timeout | redirect | connection | http_error | invalid_url | non_html
)

SCRAPER_PAGE_SIZE_BYTES = Histogram(
    "scraper_page_size_bytes",
    "Size of fetched HTML pages in bytes",
    buckets=(1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000),
)

# ---------------------------------------------------------------------------
# AI analysis (Gemini)
# ---------------------------------------------------------------------------

AI_DURATION = Histogram(
    "ai_analysis_duration_seconds",
    "Gemini API call duration (per attempt)",
    buckets=(0.5, 1, 2, 5, 10, 20, 30),
)

AI_RETRIES = Counter(
    "ai_analysis_retries_total",
    "Number of Gemini API retry attempts",
)

AI_ERRORS = Counter(
    "ai_analysis_errors_total",
    "AI analysis failures by error category",
    ["reason"],  # timeout | api_error | empty_response | parse_error | schema_error | insufficient_suggestions
)

AI_SCORES = Histogram(
    "ai_analysis_scores",
    "Distribution of landing-page scores returned by AI",
    buckets=(10, 20, 30, 40, 50, 60, 70, 80, 90, 100),
)

# ---------------------------------------------------------------------------
# Response cache
# ---------------------------------------------------------------------------

CACHE_HITS = Counter(
    "cache_hits_total",
    "Number of cache hits",
)

CACHE_MISSES = Counter(
    "cache_misses_total",
    "Number of cache misses",
)

CACHE_SIZE = Gauge(
    "cache_entries_current",
    "Current number of entries in the response cache",
)

CACHE_EVICTIONS = Counter(
    "cache_evictions_total",
    "Number of cache entries evicted during cleanup",
)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

RATE_LIMIT_BLOCKED = Counter(
    "rate_limit_blocked_total",
    "Requests blocked by rate limiter",
    ["reason"],  # limit_exceeded | duplicate_request
)
