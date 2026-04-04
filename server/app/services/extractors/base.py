from __future__ import annotations

from typing import Protocol, TypeVar

from bs4 import BeautifulSoup

T_co = TypeVar("T_co", covariant=True)


class Extractor(Protocol[T_co]):
    """Contract that every page extractor must satisfy."""

    def extract(self, soup: BeautifulSoup) -> T_co: ...
