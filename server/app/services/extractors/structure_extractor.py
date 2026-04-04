from bs4 import BeautifulSoup

from app.services.extractors.models import StructureData


class StructureExtractor:
    """Extracts heading hierarchy (h1/h2) from the page DOM."""

    def extract(self, soup: BeautifulSoup) -> StructureData:
        h1_headings = [
            tag.get_text(strip=True)
            for tag in soup.find_all("h1")
            if tag.get_text(strip=True)
        ]

        h2_headings = [
            tag.get_text(strip=True)
            for tag in soup.find_all("h2")
            if tag.get_text(strip=True)
        ]

        return StructureData(h1_headings=h1_headings, h2_headings=h2_headings)
