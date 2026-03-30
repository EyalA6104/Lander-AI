"""Centralized structured logging configuration using structlog.

Call ``setup_logging()`` once at application startup (before any log calls)
to configure both structlog and the stdlib logging bridge.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from contextvars import ContextVar

import structlog

# ---------------------------------------------------------------------------
# Request-scoped context (populated by RequestContextMiddleware)
# ---------------------------------------------------------------------------

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")
request_method_var: ContextVar[str] = ContextVar("request_method", default="")
request_path_var: ContextVar[str] = ContextVar("request_path", default="")
client_ip_var: ContextVar[str] = ContextVar("client_ip", default="")

# ---------------------------------------------------------------------------
# Sensitive-data scrubbing
# ---------------------------------------------------------------------------

_SENSITIVE_KEYS = re.compile(
    r"(api[_-]?key|secret|token|password|authorization|credential)",
    re.IGNORECASE,
)
_REDACTED = "[REDACTED]"


def _scrub_sensitive_data(
    _logger: object, _method: str, event_dict: dict
) -> dict:
    """Replace values of keys that look like secrets."""
    for key in list(event_dict):
        if isinstance(key, str) and _SENSITIVE_KEYS.search(key):
            event_dict[key] = _REDACTED
    return event_dict


# ---------------------------------------------------------------------------
# Inject request context from contextvars
# ---------------------------------------------------------------------------

def _inject_request_context(
    _logger: object, _method: str, event_dict: dict
) -> dict:
    rid = request_id_var.get("-")
    if rid != "-":
        event_dict.setdefault("request_id", rid)
    method = request_method_var.get("")
    if method:
        event_dict.setdefault("method", method)
    path = request_path_var.get("")
    if path:
        event_dict.setdefault("path", path)
    ip = client_ip_var.get("")
    if ip:
        event_dict.setdefault("client_ip", ip)
    return event_dict


# ---------------------------------------------------------------------------
# Public setup
# ---------------------------------------------------------------------------

def setup_logging() -> None:
    """Configure structlog + stdlib logging bridge. Call once at startup."""
    log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_name, logging.INFO)
    log_format = os.getenv("LOG_FORMAT", "console").lower()
    use_json = log_format == "json"

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        _inject_request_context,
        _scrub_sensitive_data,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if use_json:
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
        foreign_pre_chain=shared_processors,
    )

    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
