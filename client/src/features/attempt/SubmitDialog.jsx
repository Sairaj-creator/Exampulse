import React from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "../../components/ui/button";

export function SubmitDialog({
  open,
  onOpenChange,
  questions = [],
  answers = [],
  onConfirmSubmit,
  isSubmitting = false,
  isAutoSubmit = false,
  error = "",
}) {
  if (!open) return null;

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
    const hasAnswer =
      Array.isArray(ans?.selectedKeys) && ans.selectedKeys.length > 0;
    if (hasAnswer) answeredCount++;
    if (ans?.markedForReview) markedCount++;
  }

  const unansweredCount = questions.length - answeredCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in zoom-in-95">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isAutoSubmit
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isAutoSubmit ? <Clock size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {isAutoSubmit ? "Time Has Expired" : "Submit Examination?"}
            </h2>
            <p className="text-xs text-stone-500">
              {isAutoSubmit
                ? "Your allocated duration has ended. Your submission is being finalized automatically."
                : "Review your completion progress before finalizing your attempt."}
            </p>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="grid grid-cols-3 gap-2 text-center p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl">
          <div>
            <span className="block text-xl font-bold text-emerald-700">
              {answeredCount}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Answered
            </span>
          </div>
          <div>
            <span className="block text-xl font-bold text-amber-700">
              {unansweredCount}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Unanswered
            </span>
          </div>
          <div>
            <span className="block text-xl font-bold text-purple-700">
              {markedCount}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Marked
            </span>
          </div>
        </div>

        {unansweredCount > 0 && !isAutoSubmit && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              You have <strong>{unansweredCount} unanswered</strong> questions.
              Once submitted, you cannot return to modify answers.
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {!isAutoSubmit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isSubmitting || isAutoSubmit}
            className="w-full sm:w-auto"
          >
            {isSubmitting || isAutoSubmit ? "Finalizing…" : "Confirm & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
