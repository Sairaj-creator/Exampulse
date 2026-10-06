import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, ChevronRight, User } from "lucide-react";

export function AtRiskStudentsList({ atRisk = [] }) {
  if (!atRisk || atRisk.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
          <CheckCircle size={20} />
        </div>
        <h4 className="text-sm font-bold text-stone-800">No At-Risk Students</h4>
        <p className="text-xs text-stone-400 mt-1 max-w-sm">
          All students who took recent exams are meeting or exceeding the passing thresholds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">At-Risk Students</h3>
            <p className="text-xs text-stone-400">
              Students averaging below passing grade across their last 2 exams
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {atRisk.length} Flagged
        </span>
      </div>

      <div className="divide-y divide-stone-100">
        {atRisk.map((item) => (
          <div
            key={item.studentId}
            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-stone-50/50 -mx-2 px-2 rounded-xl transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xs shrink-0">
                {item.studentName?.charAt(0)?.toUpperCase() || <User size={14} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-stone-900 truncate">
                    {item.studentName}
                  </span>
                  {item.rollNumber && (
                    <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      {item.rollNumber}
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-400 truncate">{item.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-sm font-bold text-rose-600">
                  {item.recentAverage}%
                </div>
                <div className="text-[10px] text-stone-400">
                  Cutoff: {item.passThreshold}%
                </div>
              </div>

              <Link
                to={`/teacher/students/${item.studentId}`}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                title="View Performance Drilldown"
                aria-label={`View analytics for ${item.studentName}`}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
