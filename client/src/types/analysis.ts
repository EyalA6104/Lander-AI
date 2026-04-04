export interface DesignSignals {
  has_animations: boolean;
  animation_keyword_count: number;
  has_animation_library: boolean;
  detected_libraries: string[];
  image_count: number;
  video_count: number;
  has_media: boolean;
}

export interface ScoredSection {
  score: number | null;
  suggestions: string[];
}

export interface ContentAnalysis extends ScoredSection {
  title: string | null;
  metaDescription: string | null;
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
