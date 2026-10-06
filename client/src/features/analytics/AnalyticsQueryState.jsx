import React from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

export function AnalyticsLoadingState({ message = "Loading analytics…", minHeight = 260 }) {
  return (
    <div
      className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-xs flex flex-col items-center justify-center"
      style={{ minHeight }}
      role="status"
    >
      <LoaderCircle size={24} className="mb-2 animate-spin text-emerald-700" />
      {message}
    </div>
  );
}

export function AnalyticsErrorState({
  message = "Analytics could not be loaded.",
  onRetry,
  minHeight = 220,
}) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800 flex flex-col items-center justify-center"
      style={{ minHeight }}
      role="alert"
    >
      <AlertCircle size={24} className="mb-2 text-rose-600" />
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100"
        >
          <RefreshCw size={13} /> Try again
        </button>
      )}
    </div>
  );
}
