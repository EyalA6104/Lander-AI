from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.services.extractors import DesignSignals


class AnalyzeRequest(BaseModel):
    url: str


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ScoredSection(CamelModel):
    score: float | None = None
    suggestions: list[str] = Field(default_factory=list)


class ExperienceSignals(CamelModel):
    has_primary_cta_above_fold: bool = False
    hero_text_length: int = 0
    has_clear_value_prop: bool = False


class ContentAnalysis(ScoredSection):
    title: str | None = None
    meta_description: str | None = Field(
        default=None,
        serialization_alias="metaDescription",
    )
    experience_signals: Optional["ExperienceSignals"] = Field(
        default=None,
        serialization_alias="experienceSignals",
    )


class StructureAnalysis(ScoredSection):
    h1_headings: list[str] = Field(
        default_factory=list,
        serialization_alias="h1Headings",
    )
    h2_headings: list[str] = Field(
        default_factory=list,
        serialization_alias="h2Headings",
    )


class DesignAnalysis(ScoredSection):
    signals: DesignSignals


class UXAnalysis(ScoredSection):
    pass


class SEOAnalysis(ScoredSection):
    pass


class AnalysisData(CamelModel):
    url: str
    content: ContentAnalysis
    structure: StructureAnalysis
    design: DesignAnalysis
    ux: UXAnalysis
    seo: SEOAnalysis
    overall_score: float | None = Field(
        default=None,
        serialization_alias="overallScore",
    )


class AnalyzeResponse(BaseModel):
    status: Literal["success", "error", "partial"]
    data: AnalysisData | None = None
    error: str | None = None
