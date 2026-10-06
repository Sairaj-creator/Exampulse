import React from "react";
import { Clock } from "lucide-react";

export function Timer({ secondsLeft, formattedTime }) {
  const isCritical = secondsLeft <= 60;
  const isWarning = secondsLeft <= 300 && !isCritical;

  let colorClasses = "bg-stone-100 text-stone-800 border-stone-200";
  if (isCritical) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-300 animate-pulse";
  } else if (isWarning) {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-300";
  }

  return (
    <div
      aria-label="Exam timer"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-mono tracking-tight font-bold transition-colors ${colorClasses}`}
    >
      <Clock size={16} className={isCritical ? "text-rose-600" : isWarning ? "text-amber-600" : "text-stone-500"} />
      <span>{formattedTime}</span>
    </div>
  );
}
