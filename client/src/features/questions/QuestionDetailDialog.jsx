import React from "react";
import { CheckCircle2, HelpCircle, Archive, BookOpen, Layers } from "lucide-react";
import { FormDialog } from "../../components/common/FormDialog";
import { Button } from "../../components/ui/button";

export function QuestionDetailDialog({ open, question, onClose }) {
  if (!question) return null;

  const difficultyColors = {
    easy: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    hard: "bg-rose-100 text-rose-800 border-rose-200",
  };

  const typeLabels = {
    single: "Single Choice",
    multiple: "Multiple Choice",
    truefalse: "True / False",
  };

  return (
    <FormDialog
      open={open}
      title="Question Details"
      description={`ID: ${question._id}`}
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Badges / Meta row */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-100 text-xs">
          <span className="px-2.5 py-1 rounded-lg font-semibold bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1.5">
            <BookOpen size={13} /> {question.subjectId?.name} ({question.subjectId?.code})
          </span>
          <span className="px-2.5 py-1 rounded-lg font-semibold bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1.5">
            <Layers size={13} /> {question.topic}
          </span>
          <span className="px-2.5 py-1 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {typeLabels[question.type] || question.type}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg font-semibold border ${
              difficultyColors[question.difficulty] || "bg-stone-100 text-stone-700"
            }`}
          >
            {question.difficulty?.toUpperCase()}
          </span>
          <span className="px-2.5 py-1 rounded-lg font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            {question.defaultMarks} Marks
          </span>
          {question.isArchived && (
            <span className="px-2.5 py-1 rounded-lg font-semibold bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1">
              <Archive size={12} /> Archived
            </span>
          )}
        </div>

        {/* Stem Text */}
        <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Question Stem
          </label>
          <p className="text-sm font-medium text-stone-900 leading-relaxed whitespace-pre-wrap">
            {question.text}
          </p>
        </div>

        {/* Options List */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Configured Options & Evaluation Key
          </label>
          <div className="space-y-2">
            {question.options?.map((opt) => {
              const isCorrect = question.correctKeys?.includes(opt.key);
              return (
                <div
                  key={opt.key}
                  className={`flex items-start justify-between p-3 rounded-xl border text-sm transition-colors ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium"
                      : "border-stone-200 bg-white text-stone-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isCorrect
                          ? "bg-emerald-700 text-white"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </div>

                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0 ml-3">
                      <CheckCircle2 size={16} /> Correct
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
              <HelpCircle size={15} /> Explanation
            </div>
            <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
              {question.explanation}
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-stone-200 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}
