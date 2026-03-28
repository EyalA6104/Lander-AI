from typing import Literal
from pydantic import BaseModel, HttpUrl

from app.services.scraper import DesignSignals


class AnalyzeRequest(BaseModel):
    url: HttpUrl


class AnalysisData(BaseModel):
    url: str
    title: str | None = None
    meta_description: str | None = None
    h1_headings: list[str]
    h2_headings: list[str]
    design_signals: DesignSignals
    score: float | None = None
    suggestions: list[str] = []


class AnalyzeResponse(BaseModel):
    status: Literal["success", "error", "partial"]
    data: AnalysisData | None = None
    error: str | None = None
