import React from "react";
import { clampScore, useCountUp } from "./utils";

function truncateSuggestion(text: string, maxChars = 200): string {
  if (text.length <= maxChars) return text;
  const lastSpace = text.lastIndexOf(" ", maxChars);
  const cutAt = lastSpace > 0 ? lastSpace : maxChars;
  return text.slice(0, cutAt).trimEnd() + "\u2026";
}

export default function ScoreDial({
  label,
  value,
  toneClass,
  strokeClass,
  suggestions,
}: {
  label: string;
  value: number | null;
  toneClass: string;
  strokeClass: string;
  suggestions?: string[];
}) {
  const animatedValue = useCountUp(value);
  const displayValue = animatedValue ?? value;
  const normalizedScore = clampScore(displayValue);

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden min-h-[240px]">
      <h2
        className={`font-display font-bold text-xs md:text-sm tracking-[0.2em] uppercase mb-6 self-start ${toneClass}`}
      >
        {label}
      </h2>
      <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle
            className="text-white/5"
            cx="50%"
            cy="50%"
            fill="transparent"
            r="42%"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className={strokeClass}
            cx="50%"
            cy="50%"
            fill="transparent"
            r="42%"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray="264%"
            strokeDashoffset={`${264 - (264 * normalizedScore) / 100}%`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl md:text-6xl font-display font-black tracking-tighter text-white">
            {displayValue == null ? "--" : displayValue.toFixed(1)}
          </span>
          <span className="text-[10px] md:text-xs font-display tracking-[0.3em] uppercase text-slate-500 mt-2">
            / 100
          </span>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="w-full space-y-2">
          {suggestions.slice(0, 2).map((suggestion, index) => (
            <div
              key={`${label}-${index}`}
              className="text-xs text-slate-400 border border-white/5 bg-white/5 rounded-xl px-4 py-3"
            >
              {truncateSuggestion(suggestion)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
