import ipaddress
import re
from urllib.parse import urlparse

import structlog

logger = structlog.stdlib.get_logger("url_validator")

_MAX_URL_LENGTH = 2048
_ALLOWED_SCHEMES = {"http", "https"}

_BLOCKED_HOSTNAMES = {"localhost"}

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

_IPV4_RE = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
_IPV6_BRACKET_RE = re.compile(r"^\[(.+)]$")


class URLValidationError(Exception):
    """Raised when a submitted URL fails validation or security checks."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


def _is_private_ip(host: str) -> bool:
    """Return True if *host* resolves to a private or loopback IP address."""
    raw = host
    m = _IPV6_BRACKET_RE.match(raw)
    if m:
        raw = m.group(1)

    try:
        addr = ipaddress.ip_address(raw)
    except ValueError:
        return False

    return any(addr in net for net in _PRIVATE_NETWORKS)


def validate_url(raw_url: str) -> str:
    """Normalize and validate a URL for safe external fetching.

    Returns the normalized URL string on success.
    Raises URLValidationError with a user-safe message on failure.
    """
    url = raw_url.strip()

    if not url:
        raise URLValidationError("URL must not be empty.")

    if len(url) > _MAX_URL_LENGTH:
        raise URLValidationError(
            f"URL exceeds the maximum allowed length of {_MAX_URL_LENGTH} characters."
        )

    if "://" not in url:
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except Exception as exc:
        raise URLValidationError("URL could not be parsed.") from exc

    scheme = (parsed.scheme or "").lower()
    if scheme not in _ALLOWED_SCHEMES:
        raise URLValidationError(
            f"Unsupported protocol '{scheme}'. Only HTTP and HTTPS are allowed."
        )

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise URLValidationError("URL must include a valid hostname.")

    if hostname in _BLOCKED_HOSTNAMES:
        raise URLValidationError("Requests to local or internal addresses are not allowed.")

    if _is_private_ip(hostname):
        raise URLValidationError("Requests to local or internal addresses are not allowed.")

    if _IPV4_RE.match(hostname) or _IPV6_BRACKET_RE.match(hostname):
        try:
            addr = ipaddress.ip_address(
                _IPV6_BRACKET_RE.match(hostname).group(1)  # type: ignore[union-attr]
                if _IPV6_BRACKET_RE.match(hostname)
                else hostname
            )
            if not addr.is_global:
                raise URLValidationError(
                    "Requests to local or internal addresses are not allowed."
                )
        except ValueError as exc:
            raise URLValidationError("URL contains an invalid IP address.") from exc

    logger.debug("url_validated", raw_url=raw_url, normalized_url=url)
    return url
