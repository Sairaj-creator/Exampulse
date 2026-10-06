import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

export function SaveIndicator({ saveStatus }) {
  if (saveStatus === "saving") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
        <Loader2 size={13} className="animate-spin text-stone-400" />
        <span>Saving…</span>
      </div>
    );
  }

  if (saveStatus === "retrying") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
        <Loader2 size={13} className="animate-spin" />
        <span>Offline, retrying…</span>
      </div>
    );
  }

  if (saveStatus === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
        <AlertCircle size={13} />
        <span>Answer not saved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
      <Check size={13} className="text-emerald-600" />
      <span>Saved</span>
    </div>
  );
}
