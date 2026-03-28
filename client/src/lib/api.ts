import { AnalyzeResponse } from "@/types/analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
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

  return response.json();
}
