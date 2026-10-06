import React from "react";
import { Flag, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "../../components/ui/button";

export function QuestionPanel({
  question,
  currentIndex,
  totalQuestions,
  selectedKeys = [],
  markedForReview = false,
  onSelectOption,
  onClearAnswer,
  onToggleReview,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  if (!question) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
        No question selected.
      </div>
    );
  }

  const isMultiple = question.type === "multiple";
  const typeLabel =
    question.type === "single"
      ? "Single Choice"
      : question.type === "multiple"
        ? "Multiple Choice (Select all that apply)"
        : "True / False";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-full">
      {/* Header Info */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base text-stone-900">
            Question {currentIndex + 1}{" "}
            <span className="text-stone-400 font-normal">of {totalQuestions}</span>
          </span>
          <span className="text-xs bg-stone-200/80 text-stone-700 font-semibold px-2.5 py-0.5 rounded-full">
            {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
          </span>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold px-2.5 py-0.5 rounded-full">
            {typeLabel}
          </span>
        </div>

        {question.topic && (
          <span className="text-xs text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
            Topic: {question.topic}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
        <div className="text-base sm:text-lg text-stone-900 font-medium leading-relaxed whitespace-pre-wrap select-text">
          {question.text}
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {question.options?.map((option) => {
            const isSelected = selectedKeys.includes(option.key);

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectOption(option.key)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 shadow-xs"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-600 group-hover:bg-stone-200"
                  }`}
                >
                  {isMultiple && isSelected ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    option.key
                  )}
                </div>
                <div className="text-sm sm:text-base text-stone-800 flex-1 pt-0.5 leading-normal">
                  {option.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-6 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleReview}
            className={`gap-1.5 text-xs font-semibold ${
              markedForReview
                ? "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100"
                : "text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            <Flag
              size={14}
              className={markedForReview ? "fill-purple-600 text-purple-600" : "text-stone-500"}
            />
            {markedForReview ? "Marked for Review" : "Mark for Review"}
          </Button>

          {selectedKeys.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAnswer}
              className="gap-1.5 text-xs text-stone-600 hover:text-stone-900"
            >
              <Trash2 size={14} className="text-stone-400" />
              Clear Answer
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="gap-1 text-xs"
          >
            <ChevronLeft size={16} /> Previous
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onNext}
            className="gap-1 text-xs"
          >
            {hasNext ? (
              <>
                Next <ChevronRight size={16} />
              </>
            ) : (
              "Review & Submit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
