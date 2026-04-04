from pydantic import BaseModel, Field


class ContentData(BaseModel):
    title: str | None = None
    meta_description: str | None = None


class StructureData(BaseModel):
    h1_headings: list[str] = Field(default_factory=list)
    h2_headings: list[str] = Field(default_factory=list)


class DesignSignals(BaseModel):
    has_animations: bool = False
    animation_keyword_count: int = 0
    has_animation_library: bool = False
    detected_libraries: list[str] = Field(default_factory=list)
    image_count: int = 0
    video_count: int = 0
    has_media: bool = False
    animation_density: str = "none"
    has_hover_feedback: bool = False
    has_scroll_animations: bool = False


class ExperienceSignals(BaseModel):
    button_count: int = 0
    cta_count: int = 0
    cta_text_samples: list[str] = Field(default_factory=list)
    form_count: int = 0
    input_count: int = 0
    nav_link_count: int = 0
    has_pricing_section: bool = False
    has_social_proof: bool = False
    has_faq_section: bool = False
    has_reduced_motion_support: bool = False
    has_skip_link: bool = False
    has_primary_cta_above_fold: bool = False
    hero_text_length: int = 0
    has_clear_value_prop: bool = False
