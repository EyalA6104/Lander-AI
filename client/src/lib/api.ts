import { AnalyzeResponse } from "@/types/analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type LegacyAnalyzeData = {
  url: string;
  title?: string | null;
  meta_description?: string | null;
  h1_headings?: string[];
  h2_headings?: string[];
  design_signals?: {
    has_animations?: boolean;
    animation_keyword_count?: number;
    has_animation_library?: boolean;
    detected_libraries?: string[];
    image_count?: number;
    video_count?: number;
    has_media?: boolean;
  } | null;
  score?: number | null;
  suggestions?: string[];
};

type ApiResponse = AnalyzeResponse | { status: AnalyzeResponse["status"]; data: LegacyAnalyzeData | null; error: string | null };

function normalizeResponse(response: ApiResponse): AnalyzeResponse {
  if (!response.data) {
    return response as AnalyzeResponse;
  }

  if ("content" in response.data && "design" in response.data) {
    return response as AnalyzeResponse;
  }

  const legacy = response.data as LegacyAnalyzeData;

  return {
    status: response.status,
    error: response.error,
    data: {
      url: legacy.url,
      content: {
        title: legacy.title ?? null,
        metaDescription: legacy.meta_description ?? null,
        score: null,
        suggestions: [],
      },
      structure: {
        h1Headings: legacy.h1_headings ?? [],
        h2Headings: legacy.h2_headings ?? [],
        score: null,
        suggestions: [],
      },
      design: {
        signals: {
          has_animations: legacy.design_signals?.has_animations ?? false,
          animation_keyword_count:
            legacy.design_signals?.animation_keyword_count ?? 0,
          has_animation_library:
            legacy.design_signals?.has_animation_library ?? false,
          detected_libraries: legacy.design_signals?.detected_libraries ?? [],
          image_count: legacy.design_signals?.image_count ?? 0,
          video_count: legacy.design_signals?.video_count ?? 0,
          has_media: legacy.design_signals?.has_media ?? false,
          // Extended fields — null in legacy mode; UI handles gracefully
          animation_density: null,
          has_hover_feedback: null,
          has_scroll_animations: null,
        },
        score: null,
        suggestions: legacy.suggestions ?? [],
      },
      ux: {
        score: null,
        suggestions: [],
      },
      seo: {
        score: null,
        suggestions: [],
      },
      overallScore: legacy.score ?? null,
    },
  };
}

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    
    // First try to extract our standardized error message
    if (errorBody && errorBody.error) {
      throw new Error(errorBody.error);
    }
    
    // Fallback to detailed validation error or generic status message
    const message = errorBody?.detail?.[0]?.msg || `Request failed (${response.status})`;
    throw new Error(message);
  }

  const payload = (await response.json()) as ApiResponse;
  return normalizeResponse(payload);
}
