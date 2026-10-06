import React from "react";
import { Flag, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";

export function Palette({
  questions = [],
  currentIndex = 0,
  answers = [],
  onSelectIndex,
  onSubmitClick,
}) {
  const answerMap = new Map();
  for (const a of answers) {
    const qIdStr = a.questionId?._id
      ? a.questionId._id.toString()
      : a.questionId?.toString();
    if (qIdStr) {
      answerMap.set(qIdStr, a);
    }
  }

  let answeredCount = 0;
  let markedCount = 0;

  for (const q of questions) {
    const qIdStr = q._id?.toString();
    const ans = answerMap.get(qIdStr);
    const hasAnswer = Array.isArray(ans?.selectedKeys) && ans.selectedKeys.length > 0;
    if (hasAnswer) answeredCount++;
    if (ans?.markedForReview) markedCount++;
  }

  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Palette Header */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/50">
        <h2 className="font-bold text-sm text-stone-900 mb-2">Question Palette</h2>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg py-1.5 px-1 font-medium">
            <span className="font-bold block text-sm">{answeredCount}</span>
            Answered
          </div>
          <div className="bg-purple-50 text-purple-800 border border-purple-200/60 rounded-lg py-1.5 px-1 font-medium">
            <span className="font-bold block text-sm">{markedCount}</span>
            Marked
          </div>
          <div className="bg-stone-100 text-stone-700 border border-stone-200/80 rounded-lg py-1.5 px-1 font-medium">
            <span className="font-bold block text-sm">{unansweredCount}</span>
            Remaining
          </div>
        </div>
      </div>

      {/* Question Grid */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const qIdStr = q._id?.toString();
            const ans = answerMap.get(qIdStr);
            const isAnswered =
              Array.isArray(ans?.selectedKeys) && ans.selectedKeys.length > 0;
            const isMarked = Boolean(ans?.markedForReview);
            const isCurrent = idx === currentIndex;

            let badgeStyle = "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200";
            if (isAnswered && isMarked) {
              badgeStyle = "bg-purple-600 text-white ring-2 ring-emerald-500 border-transparent";
            } else if (isMarked) {
              badgeStyle = "bg-purple-600 text-white border-transparent";
            } else if (isAnswered) {
              badgeStyle = "bg-emerald-600 text-white border-transparent";
            }

            return (
              <button
                key={q._id || idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`Question ${idx + 1}`}
                className={`h-10 w-full rounded-xl text-xs font-bold transition-all relative flex items-center justify-center border cursor-pointer ${badgeStyle} ${
                  isCurrent ? "ring-2 ring-stone-900 ring-offset-2 scale-105 shadow-xs" : ""
                }`}
              >
                {idx + 1}
                {isMarked && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-400 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Submit button */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-3">
        <div className="text-[11px] text-stone-500 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-purple-600 inline-block" />
            <span>Marked for review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-stone-200 inline-block" />
            <span>Not answered</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={onSubmitClick}
          className="w-full text-xs font-semibold py-2.5"
        >
          Submit Exam
        </Button>
      </div>
    </div>
  );
}
