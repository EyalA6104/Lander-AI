"""Middleware that assigns a unique request ID and populates contextvars.

Every downstream log line automatically inherits the request context
(request_id, method, path, client_ip) without callers needing to pass it.
"""

from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging_config import (
    client_ip_var,
    request_id_var,
    request_method_var,
    request_path_var,
)


class RequestContextMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        incoming_id = request.headers.get("x-request-id")
        req_id = incoming_id or uuid.uuid4().hex[:16]

        request_id_var.set(req_id)
        request_method_var.set(request.method)
        request_path_var.set(request.url.path)
        client_ip_var.set(self._get_client_ip(request))

        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"
