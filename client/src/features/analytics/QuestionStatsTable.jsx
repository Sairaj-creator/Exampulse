import React, { useState } from "react";
import { AlertCircle, HelpCircle, ArrowUpDown, Flame, Sparkles } from "lucide-react";

export function QuestionStatsTable({ questions = [] }) {
  const [sortField, setSortField] = useState("correctPct");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  const hasResponses = (questions || []).some(
    (question) => Number(question.attemptedCount) > 0,
  );

  if (!questions || questions.length === 0 || !hasResponses) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 shadow-xs">
        No question statistics available yet. Statistics compile automatically after student submissions.
      </div>
    );
  }

  // Sorted list
  const sorted = [...questions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === null || aVal === undefined) aVal = -999;
    if (bVal === null || bVal === undefined) bVal = -999;
    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Hardest & Easiest callouts
  const byDifficulty = [...questions].sort((a, b) => (a.correctPct ?? 0) - (b.correctPct ?? 0));
  const hardestQuestion = byDifficulty[0];
  const easiestQuestion = byDifficulty[byDifficulty.length - 1];

  const getDifficultyBadge = (diff) => {
    if (!diff) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-200 uppercase">
          No data
        </span>
      );
    }
    if (diff === "easy") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
          Easy
        </span>
      );
    }
    if (diff === "medium") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
          Medium
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 uppercase">
        Hard
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Callout Cards: Hardest & Easiest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hardestQuestion && (
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-xs">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <Flame size={18} />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Most Challenging Item · {hardestQuestion.correctPct}% Correct
              </div>
              <h4 className="text-xs font-semibold text-rose-950 line-clamp-2">
                {hardestQuestion.text}
              </h4>
              <p className="text-[11px] text-rose-800">
                Topic: <strong>{hardestQuestion.topic}</strong> · {hardestQuestion.unansweredPct}% skipped
              </p>
            </div>
          </div>
        )}

        {easiestQuestion && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Highest Accuracy Item · {easiestQuestion.correctPct}% Correct
              </div>
              <h4 className="text-xs font-semibold text-emerald-950 line-clamp-2">
                {easiestQuestion.text}
              </h4>
              <p className="text-[11px] text-emerald-800">
                Topic: <strong>{easiestQuestion.topic}</strong> · Tagged {easiestQuestion.taggedDifficulty}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions Breakdown Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Per-Question Psychometric Analysis</h3>
            <p className="text-xs text-stone-400">
              Item difficulty index, distractor frequency, and discrimination index (D)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Question & Topic</th>
                <th className="py-3 px-4 text-center">Difficulty (Tag / Obs)</th>
                <th
                  className="py-3 px-4 text-center cursor-pointer hover:bg-stone-100/70"
                  onClick={() => handleSort("correctPct")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Correct % <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-center cursor-pointer hover:bg-stone-100/70"
                  onClick={() => handleSort("unansweredPct")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Skipped % <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Option Distractors</th>
                <th
                  className="py-3 px-4 text-center cursor-pointer hover:bg-stone-100/70"
                  onClick={() => handleSort("discriminationIndex")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Discrimination (D) <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((q, idx) => (
                <tr key={q.questionId} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold text-stone-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-stone-900 line-clamp-2">
                      {q.text}
                    </p>
                    <span className="text-[10px] text-stone-400">
                      Topic: <strong>{q.topic}</strong>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400">Tag:</span>
                        {getDifficultyBadge(q.taggedDifficulty)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400">Obs:</span>
                        {getDifficultyBadge(q.observedDifficulty)}
                      </div>
                      {q.difficultyMismatch && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                          Mismatch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="mx-auto flex min-w-20 max-w-28 flex-col gap-1.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          q.correctPct >= 70
                            ? "bg-emerald-50 text-emerald-800"
                            : q.correctPct >= 40
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {q.correctPct}%
                      </span>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-stone-100"
                        aria-label={`${q.correctPct}% answered correctly`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            q.correctPct >= 70
                              ? "bg-emerald-500"
                              : q.correctPct >= 40
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, q.correctPct || 0))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-stone-600">
                    {q.unansweredPct}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {Object.entries(q.optionCounts || {}).map(([key, count]) => (
                        <div
                          key={key}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono"
                          title={`Option ${key}: ${count} selections`}
                        >
                          <strong>{key}:</strong> {count}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    {q.discriminationIndex !== null ? (
                      <span
                        className={
                          q.discriminationIndex >= 0.3
                            ? "text-emerald-700"
                            : q.discriminationIndex >= 0.15
                            ? "text-stone-700"
                            : "text-rose-700"
                        }
                      >
                        {q.discriminationIndex >= 0 ? `+${q.discriminationIndex}` : q.discriminationIndex}
                      </span>
                    ) : (
                      <span className="text-stone-400 font-normal text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
