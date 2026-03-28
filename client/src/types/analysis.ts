export interface DesignSignals {
  has_animations: boolean;
  animation_keyword_count: number;
  has_animation_library: boolean;
  detected_libraries: string[];
  image_count: number;
  video_count: number;
  has_media: boolean;
}

export interface AnalysisData {
  url: string;
  title: string | null;
  meta_description: string | null;
  h1_headings: string[];
  h2_headings: string[];
  design_signals: DesignSignals;
  score: number | null;
  suggestions: string[];
}

export interface AnalyzeResponse {
  status: "success" | "error" | "partial";
  data: AnalysisData | null;
  error: string | null;
}
