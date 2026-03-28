interface ErrorMessageProps {
  message: string;
  type?: "error" | "warning";
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, type = "error", onDismiss }: ErrorMessageProps) {
  const isWarning = type === "warning";

  const containerClasses = isWarning
    ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
    : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30";

  const iconClasses = isWarning
    ? "text-amber-500 dark:text-amber-400"
    : "text-red-500 dark:text-red-400";

  const titleClasses = isWarning
    ? "text-amber-800 dark:text-amber-200"
    : "text-red-800 dark:text-red-200";

  const textClasses = isWarning
    ? "text-amber-700 dark:text-amber-300"
    : "text-red-600 dark:text-red-300";

  const buttonClasses = isWarning
    ? "text-amber-500 hover:text-amber-700 dark:text-amber-600 dark:hover:text-amber-400"
    : "text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300";

  const titleText = isWarning ? "Analysis Incomplete" : "Analysis failed";

  return (
    <div
      id="analysis-error"
      className={`animate-fade-in flex w-full items-start gap-3 rounded-xl border p-4 ${containerClasses}`}
    >
      <svg
        className={`mt-0.5 h-5 w-5 shrink-0 ${iconClasses}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {isWarning ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
      <div className="flex-1">
        <p className={`text-sm font-medium ${titleClasses}`}>
          {titleText}
        </p>
        <p className={`mt-0.5 text-sm ${textClasses}`}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`shrink-0 rounded-md p-1 transition-colors ${buttonClasses}`}
          aria-label="Dismiss error"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
