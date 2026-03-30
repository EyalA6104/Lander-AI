"use client";

import { useState } from "react";

interface AnalyzeFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const MAX_URL_LENGTH = 2048;
const BLOCKED_HOSTS = new Set(["localhost"]);
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
];

function validateUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "Please enter a URL";

  if (trimmed.length > MAX_URL_LENGTH) {
    return `URL exceeds the maximum allowed length of ${MAX_URL_LENGTH} characters`;
  }

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const parsed = new URL(urlString);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "Only HTTP and HTTPS URLs are supported";
    }

    const hostname = parsed.hostname.toLowerCase();

    if (!hostname || !hostname.includes(".")) {
      return "Please enter a valid website URL";
    }

    if (BLOCKED_HOSTS.has(hostname)) {
      return "Requests to local or internal addresses are not allowed";
    }

    if (PRIVATE_IP_PATTERNS.some((re) => re.test(hostname))) {
      return "Requests to local or internal addresses are not allowed";
    }

    return null;
  } catch {
    return "Please enter a valid website URL";
  }
}

function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export default function AnalyzeForm({ onSubmit, isLoading }: AnalyzeFormProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    if (validationError && (!value.trim() || !validateUrl(value))) {
      setValidationError(null);
    }
  };

  const handleBlur = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError(null);
      return;
    }
    setValidationError(validateUrl(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(url);
    if (error) {
      setValidationError(error);
      return;
    }
    onSubmit(normalizeUrl(url));
  };

  const showError = !!validationError;

  const inputBorderClasses = showError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500/20"
    : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <input
            id="url-input"
            type="text"
            inputMode="url"
            value={url}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://your-landing-page.com"
            disabled={isLoading}
            aria-invalid={showError}
            aria-describedby={showError ? "url-error" : undefined}
            className={`h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 ${inputBorderClasses}`}
          />
        </div>
        {showError && (
          <p id="url-error" role="alert" className="mt-1.5 px-1 text-xs text-red-500 dark:text-red-400">
            {validationError}
          </p>
        )}
      </div>
      <button
        id="analyze-button"
        type="submit"
        disabled={isLoading || !url.trim() || showError}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:w-auto"
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {isLoading ? "Analyzing" : "Analyze"}
      </button>
    </form>
  );
}
