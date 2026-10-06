import React, { useState } from "react";
import {
  Check,
  X,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";

export function ReviewList({
  evaluations = [],
  allowFullReview = false,
  reviewPolicy = "immediate",
  reviewAvailableAt = null,
}) {
  const [filter, setFilter] = useState("all"); // "all" | "correct" | "wrong" | "unanswered"

  const filteredEvals = evaluations.filter((ev) => {
    if (filter === "correct") return ev.isCorrect;
    if (filter === "wrong")
      return !ev.isCorrect && ev.selectedKeys && ev.selectedKeys.length > 0;
    if (filter === "unanswered")
      return !ev.selectedKeys || ev.selectedKeys.length === 0;
    return true;
  });

  if (!allowFullReview) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
          <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-amber-900">
              Answer Review Restricted by Policy
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              {reviewPolicy === "after_end"
                ? `Official correct answers and explanations will be unlocked automatically after the examination window concludes${
                    reviewAvailableAt
                      ? ` on ${new Date(reviewAvailableAt).toLocaleString()}`
                      : ""
                  }.`
                : "The instructor has configured this examination to keep answer keys and explanations hidden."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-bold text-stone-900">
          Question Evaluations
        </h2>
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "all"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            All ({evaluations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("correct")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "correct"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Correct ({evaluations.filter((e) => e.isCorrect).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("wrong")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "wrong"
                ? "bg-white text-rose-800 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Incorrect (
            {
              evaluations.filter(
                (e) => !e.isCorrect && e.selectedKeys?.length > 0,
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter("unanswered")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "unanswered"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Skipped (
            {
              evaluations.filter(
                (e) => !e.selectedKeys || e.selectedKeys.length === 0,
              ).length
            }
            )
          </button>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredEvals.map((item, idx) => {
          const isAnswered = item.selectedKeys && item.selectedKeys.length > 0;
          const statusBadge = item.isCorrect ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <Check size={12} className="stroke-[3]" /> Correct
            </span>
          ) : isAnswered ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              <X size={12} className="stroke-[3]" /> Incorrect
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
              <HelpCircle size={12} /> Skipped
            </span>
          );

          return (
            <div
              key={item.questionId || idx}
              className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Question Item Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">
                    Question {item.questionNumber || idx + 1}
                  </span>
                  {statusBadge}
                  {item.topic && (
                    <span className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md">
                      {item.topic}
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-stone-700">
                  Awarded:{" "}
                  <span
                    className={
                      item.marksAwarded > 0
                        ? "text-emerald-700"
                        : item.marksAwarded < 0
                          ? "text-rose-700"
                          : "text-stone-600"
                    }
                  >
                    {item.marksAwarded}
                  </span>{" "}
                  / {item.marks} pts
                </div>
              </div>

              {/* Stem */}
              <div className="text-sm sm:text-base font-medium text-stone-900 whitespace-pre-wrap leading-relaxed">
                {item.text}
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {item.options?.map((opt) => {
                  const isUserSelected = item.selectedKeys?.includes(opt.key);
                  const isCorrectKey =
                    allowFullReview && item.correctKeys?.includes(opt.key);

                  let optCardStyle = "border-stone-200 bg-white text-stone-700";
                  if (allowFullReview) {
                    if (isCorrectKey) {
                      optCardStyle =
                        "border-emerald-500 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-500";
                    } else if (isUserSelected && !item.isCorrect) {
                      optCardStyle =
                        "border-rose-400 bg-rose-50/60 text-rose-950 ring-1 ring-rose-400";
                    }
                  } else {
                    if (isUserSelected) {
                      optCardStyle =
                        "border-stone-400 bg-stone-50 text-stone-900 font-medium";
                    }
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${optCardStyle}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrectKey
                            ? "bg-emerald-600 text-white"
                            : isUserSelected &&
                                !item.isCorrect &&
                                allowFullReview
                              ? "bg-rose-600 text-white"
                              : isUserSelected
                                ? "bg-stone-800 text-white"
                                : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {opt.key}
                      </div>

                      <div className="text-xs sm:text-sm flex-1 pt-0.5 leading-normal">
                        {opt.text}
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold">
                        {isUserSelected && (
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              allowFullReview
                                ? item.isCorrect
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                                : "bg-stone-200 text-stone-800"
                            }`}
                          >
                            Your Choice
                          </span>
                        )}
                        {isCorrectKey && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            Correct Key
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation (if allowed by policy) */}
              {allowFullReview && item.explanation && (
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Lightbulb
                    size={16}
                    className="text-emerald-700 shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-emerald-900 mb-0.5">
                      Explanation:
                    </span>
                    <span className="leading-relaxed">{item.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
