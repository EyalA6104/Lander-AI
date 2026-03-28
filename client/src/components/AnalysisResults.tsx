import { useState } from "react";
import { AnalysisData } from "@/types/analysis";

interface AnalysisResultsProps {
  data: AnalysisData;
}

function getScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Critical Issues";
}

function formatSuggestion(text: string) {
  // Attempt to separate title from body
  const match = text.match(/^(.*?)(:| - |\.)\s*(.*)$/);
  if (match && match[1].length < 100) {
    const title = match[1] + (match[2] === "." ? "" : "");
    const body = match[3];
    return { title, body };
  }
  return { title: text, body: null };
}

function SignalBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-24 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-sm text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const ds = data.design_signals;

  return (
    <div id="analysis-results" className="animate-fade-in w-full space-y-12">
      {/* 
        Section: Score & Suggestions 
        Visually connected, no separate card borders.
      */}
      <div className="space-y-10">
        {/* Score Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
            Overall Score
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-7xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">
              {data.score !== null ? data.score : "N/A"}
            </span>
            {data.score !== null && (
              <span className="text-2xl font-bold text-indigo-300 dark:text-indigo-800/60">
                /100
              </span>
            )}
          </div>
          <div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {getScoreLabel(data.score)}
          </div>
        </div>

        {/* Suggestions List */}
        <div>
          <h3 className="mb-6 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Actionable Suggestions
          </h3>
          <ul className="space-y-4">
            {data.suggestions.length > 0 ? (
              data.suggestions.map((suggestion: string, index: number) => {
                const { title, body } = formatSuggestion(suggestion);
                return (
                  <li
                    key={index}
                    className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-1 pt-1.5">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {title}
                      </span>
                      {body && (
                        <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {body}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="flex items-center justify-center rounded-2xl bg-zinc-50 p-6 text-sm text-zinc-500 ring-1 ring-zinc-200/50 dark:bg-zinc-900/50 dark:text-zinc-400 dark:ring-zinc-800/50">
                No AI suggestions available at this time.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 
        Section: Technical Details
        Collapsible to de-emphasize and keep UI minimal 
      */}
      <div className="border-t border-zinc-200 dark:border-zinc-800/60">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between py-6 text-left group"
        >
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Technical Details
          </span>
          <svg
            className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${
              showDetails ? "rotate-180" : ""
            } group-hover:text-zinc-600 dark:group-hover:text-zinc-300`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="space-y-8 pb-8 animate-fade-in">
            {/* Page Info */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Page Info
              </h4>
              <div className="space-y-3">
                <DetailRow label="Title" value={data.title || "—"} />
                <DetailRow label="Description" value={data.meta_description || "—"} />
              </div>
            </div>

            {/* Headings */}
            {(data.h1_headings.length > 0 || data.h2_headings.length > 0) && (
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Headings
                </h4>
                <ul className="space-y-2">
                  {data.h1_headings.map((h, i) => (
                    <li key={`h1-${i}`} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        H1
                      </span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{h}</span>
                    </li>
                  ))}
                  {data.h2_headings.map((h, i) => (
                    <li key={`h2-${i}`} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500">
                        H2
                      </span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Design Signals */}
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Design Signals
              </h4>
              <div className="mb-4 flex flex-wrap gap-2">
                <SignalBadge active={ds.has_animations} label="Animations" />
                <SignalBadge active={ds.has_animation_library} label="Animation Library" />
                <SignalBadge active={ds.has_media} label="Media" />
              </div>
              <div className="space-y-3">
                <DetailRow label="Images Found" value={String(ds.image_count)} />
                <DetailRow label="Videos Found" value={String(ds.video_count)} />
                {ds.detected_libraries.length > 0 && (
                  <DetailRow label="Libraries" value={ds.detected_libraries.join(", ")} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
