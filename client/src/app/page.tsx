"use client";

import { useEffect, useState } from "react";
import { AnalysisData } from "@/types/analysis";
import { analyzeUrl } from "@/lib/api";
import AnalyzeForm from "@/components/AnalyzeForm";
import AnalysisResults from "@/components/AnalysisResults";
import ErrorMessage from "@/components/ErrorMessage";

export default function Home() {
  const [serverStatus, setServerStatus] = useState<
    "connecting" | "online" | "offline"
  >("connecting");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then(() => setServerStatus("online"))
      .catch(() => setServerStatus("offline"));
  }, []);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    // Don't clear result immediately to maintain layout stability during "re-analysis"
    // Just show loading state. Actually, if we just set isLoading=true, the skeleton will show instead of the result.

    try {
      const response = await analyzeUrl(url);
      if (response.status === "success" && response.data) {
        setResult(response.data);
      } else if (response.status === "partial" && response.data) {
        setResult(response.data);
        setError(response.error || "Analysis completed with partial data.");
      } else {
        setError(response.error || "Analysis failed");
        setResult(null); // Clear on critical error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-zinc-950">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Lander<span className="text-indigo-600 dark:text-indigo-400">-AI</span>
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            Analyze your landing page and get actionable suggestions
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Input */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Page URL to analyze
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    serverStatus === "online"
                      ? "bg-emerald-500"
                      : serverStatus === "offline"
                        ? "bg-red-500"
                        : "animate-pulse bg-amber-500"
                  }`}
                />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {serverStatus === "online"
                    ? "Backend online"
                    : serverStatus === "offline"
                      ? "Backend offline"
                      : "Connecting…"}
                </span>
              </div>
            </div>
            
            <AnalyzeForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </section>

          {/* Divider */}
          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800/50" />

          {/* Section 2: Results & Loading */}
          <section className="min-h-[400px]">
            {/* Error Message rendering tied to Results area */}
            {error && (
              <div className="mb-8">
                <ErrorMessage 
                  message={error} 
                  type={result && error ? "warning" : "error"} 
                  onDismiss={() => setError(null)} 
                />
              </div>
            )}

            {isLoading ? (
              <div className="animate-pulse space-y-12">
                {/* Score Skeleton */}
                <div className="flex flex-col items-center gap-4">
                  <div className="h-4 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-20 w-32 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
                </div>
                {/* Suggestions Skeleton */}
                <div className="space-y-6">
                  <div className="h-5 w-40 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="space-y-2 flex-1">
                          <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                          <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : result ? (
              <AnalysisResults data={result} />
            ) : (
              /* Empty State Placeholder to prevent layout shift */
              <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center opacity-40">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Ready to analyze</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter a URL above to generate a score and see actionable suggestions.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer Link */}
        <div className="mt-16 flex justify-center">
          <a
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-300"
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            API Docs
          </a>
        </div>
      </div>
    </div>
  );
}

