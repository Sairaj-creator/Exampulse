import React from "react";
import { Eye, Edit3, Trash2, Archive, CheckCircle2 } from "lucide-react";
import { DataTable } from "../../components/common/DataTable";
import { EmptyState } from "../../components/common/EmptyState";
import { Button } from "../../components/ui/button";

export function QuestionTable({
  questions = [],
  onView,
  onEdit,
  onDelete,
  onCreateNew,
  canEdit = true,
}) {
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

  const columns = [
    {
      key: "text",
      label: "Question Stem",
      render: (q) => (
        <div className="space-y-1.5 max-w-md">
          <div className="font-semibold text-stone-900 line-clamp-2 leading-snug">
            {q.text}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
            <span className="font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {q.subjectId?.code || "Subject"}
            </span>
            <span>•</span>
            <span className="text-stone-600 font-medium">{q.topic}</span>
            <span>•</span>
            <span className="text-stone-500">{q.options?.length || 0} options</span>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type & Keys",
      render: (q) => (
        <div className="space-y-1">
          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {typeLabels[q.type] || q.type}
          </span>
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-700" />
            <span className="font-semibold text-stone-700">
              {q.correctKeys?.join(", ")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "difficulty",
      label: "Difficulty",
      render: (q) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${
            difficultyColors[q.difficulty] || "bg-stone-100 text-stone-700"
          }`}
        >
          {q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : "Medium"}
        </span>
      ),
    },
    {
      key: "defaultMarks",
      label: "Marks",
      render: (q) => (
        <span className="font-semibold text-stone-800 text-xs bg-stone-100 px-2 py-1 rounded-md border border-stone-200">
          {q.defaultMarks ?? 1} mk
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (q) =>
        q.isArchived ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-200 text-stone-700 border border-stone-300">
            <Archive size={12} /> Archived
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (q) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onView(q)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Inspect Question Details"
          >
            <Eye size={16} />
          </button>

          {canEdit && !q.isArchived && (
            <button
              type="button"
              onClick={() => onEdit(q)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Edit Question"
            >
              <Edit3 size={16} />
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => onDelete(q)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title={q.isArchived ? "Archive/Delete Question" : "Delete or Archive Question"}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border border-[#dfe3dc] rounded-2xl overflow-hidden shadow-xs">
      <DataTable
        columns={columns}
        rows={questions}
        rowKey="_id"
        empty={
          <EmptyState
            title="No questions found in this view"
            description="Adjust your search filters or construct your first question to populate the bank."
            action={
              canEdit && (
                <Button size="sm" onClick={onCreateNew}>
                  Create First Question
                </Button>
              )
            }
          />
        }
      />
    </div>
  );
}
