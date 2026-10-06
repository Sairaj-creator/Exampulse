import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export function ScoreRing({
  score = 0,
  totalMarks = 0,
  percentage = 0,
  passed = false,
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = Math.max(0, Math.min(100, Number(percentage) || 0));
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-center justify-center text-center shadow-xs">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-stone-100"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={passed ? "stroke-emerald-600" : "stroke-rose-600"}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-stone-900">
            {percentage}%
          </span>
          <span className="text-xs font-semibold text-stone-400 mt-0.5">
            {score} / {totalMarks} pts
          </span>
        </div>
      </div>

      <div className="mt-4">
        {passed ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Passed Examination
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle size={14} className="text-rose-600" />
            Did Not Pass
          </span>
        )}
      </div>
    </div>
  );
}
