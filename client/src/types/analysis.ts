export interface DesignSignals {
  has_animations: boolean;
  animation_keyword_count: number;
  has_animation_library: boolean;
  detected_libraries: string[];
  image_count: number;
  video_count: number;
  has_media: boolean;
  // Extended signals (Phase 2)
  animation_density: "low" | "medium" | "high" | "none" | null;
  has_hover_feedback: boolean | null;
  has_scroll_animations: boolean | null;
}

export interface ExperienceSignals {
  has_primary_cta_above_fold: boolean | null;
  hero_text_length: number | null;
  has_clear_value_prop: boolean | null;
}

export interface ScoredSection {
  score: number | null;
  suggestions: string[];
}

export interface ContentAnalysis extends ScoredSection {
  title: string | null;
  metaDescription: string | null;
  // Optional hero/CTA signals forwarded from the experience extractor
  experienceSignals?: ExperienceSignals | null;
}

export interface StructureAnalysis extends ScoredSection {
  h1Headings: string[];
  h2Headings: string[];
}

export interface DesignAnalysis extends ScoredSection {
  signals: DesignSignals;
}

export type UXAnalysis = ScoredSection;

export type SEOAnalysis = ScoredSection;

export interface AnalysisData {
  url: string;
  content: ContentAnalysis;
  structure: StructureAnalysis;
  design: DesignAnalysis;
  ux: UXAnalysis;
  seo: SEOAnalysis;
  overallScore: number | null;
}

export interface AnalyzeResponse {
  status: "success" | "error" | "partial";
  data: AnalysisData | null;
  error: string | null;
}

export const SECTION_WEIGHTS = {
  content: 30,
  ux: 30,
  design: 25,
  structure: 10,
  seo: 5,
} as const;
