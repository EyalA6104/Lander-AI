from bs4 import BeautifulSoup

from app.services.extractors.models import ContentData


class ContentExtractor:
    """Extracts title and meta-description from the page DOM."""

    def extract(self, soup: BeautifulSoup) -> ContentData:
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else None

        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = (
            meta_desc_tag.get("content", "").strip()
            if meta_desc_tag
            else None
        )
        if meta_description == "":
            meta_description = None

        return ContentData(title=title, meta_description=meta_description)
