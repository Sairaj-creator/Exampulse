import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Copy,
  Eye,
  FilePenLine,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PageHeader } from "../../components/common/PageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import { ExamStatusBadge } from "../../features/exams/ExamStatusBadge";
import {
  deleteExamApi,
  duplicateExamApi,
  listExamsApi,
  publishExamApi,
  unpublishExamApi,
} from "../../features/exams/api";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function ExamsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const query = useQuery({
    queryKey: ["exams", status],
    queryFn: () => listExamsApi(status ? { status } : {}),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["exams"] });
  const action = useMutation({
    mutationFn: async ({ type, exam }) => {
      if (type === "publish") return publishExamApi(exam._id);
      if (type === "unpublish") return unpublishExamApi(exam._id);
      if (type === "duplicate") return duplicateExamApi(exam._id);
      return deleteExamApi(exam._id);
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.type === "duplicate"
          ? "Draft copy created"
          : variables.type === "delete"
            ? "Draft deleted"
            : `Exam ${variables.type === "publish" ? "published" : "returned to draft"}`,
      );
      setPendingAction(null);
      refresh();
    },
    onError: (error) => toast.error(error.message || "Exam action failed"),
  });
  const exams = query.data?.exams || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Assessment workspace"
          title="Exams & Builder"
          description="Compose papers from your question repository, assign batches, and control the draft-to-published lifecycle."
          action={
            <Button asChild>
              <Link to="/teacher/exams/new">
                <Plus size={16} /> Build exam
              </Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2" aria-label="Exam status filters">
          {["", "draft", "published", "archived"].map((value) => (
            <button
              key={value || "all"}
              onClick={() => setStatus(value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                status === value
                  ? "border-primary bg-primary text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
              }`}
            >
              {value ? value[0].toUpperCase() + value.slice(1) : "All exams"}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
            Loading exams…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {query.error.message || "Could not load exams."}
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white">
            <EmptyState
              icon={CalendarDays}
              title="No exams in this view"
              description="Build a draft, choose questions, and publish it for a batch."
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {exams.map((exam) => (
              <article
                key={exam._id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <ExamStatusBadge
                        status={exam.status}
                        phase={exam.phase}
                      />
                      <span className="text-xs font-semibold text-stone-500">
                        {exam.subjectId?.code}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-stone-900">
                      {exam.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-stone-500">
                      {exam.description || "No description provided."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-stone-50 px-3 py-2 text-center">
                    <div className="text-lg font-bold text-stone-900">
                      {exam.totalMarks}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-stone-500">
                      marks
                    </div>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs">
                  <div>
                    <dt className="text-stone-500">Starts</dt>
                    <dd className="mt-1 font-semibold text-stone-800">
                      {formatDate(exam.startTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Duration</dt>
                    <dd className="mt-1 font-semibold text-stone-800">
                      {exam.durationMinutes} minutes
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Questions</dt>
                    <dd className="mt-1 font-semibold text-stone-800">
                      {exam.questions?.length || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Attempts</dt>
                    <dd className="mt-1 font-semibold text-stone-800">
                      {exam.attemptCount || 0}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/teacher/exams/${exam._id}`}>
                      <Eye size={14} /> View
                    </Link>
                  </Button>
                  {exam.status === "draft" && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/teacher/exams/${exam._id}/edit`}>
                        <FilePenLine size={14} /> Edit
                      </Link>
                    </Button>
                  )}
                  {exam.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setPendingAction({ type: "publish", exam })
                      }
                    >
                      <Send size={14} /> Publish
                    </Button>
                  )}
                  {exam.status === "published" && exam.attemptCount === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPendingAction({ type: "unpublish", exam })
                      }
                    >
                      <Undo2 size={14} /> Unpublish
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => action.mutate({ type: "duplicate", exam })}
                    disabled={action.isPending}
                  >
                    <Copy size={14} /> Duplicate
                  </Button>
                  {exam.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingAction({ type: "delete", exam })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(pendingAction)}
          title={
            pendingAction
              ? `${pendingAction.type[0].toUpperCase()}${pendingAction.type.slice(1)} ${pendingAction.exam.title}?`
              : "Confirm action"
          }
          description={
            pendingAction?.type === "publish"
              ? "Publishing makes this exam available to assigned batches when its time window opens."
              : pendingAction?.type === "delete"
                ? "This permanently deletes the draft."
                : "The exam returns to draft so its paper and rules can be edited."
          }
          confirmLabel={
            pendingAction?.type === "delete"
              ? "Delete draft"
              : pendingAction?.type || "Confirm"
          }
          destructive={pendingAction?.type === "delete"}
          busy={action.isPending}
          onClose={() => setPendingAction(null)}
          onConfirm={() => action.mutate(pendingAction)}
        />
      </div>
    </DashboardLayout>
  );
}
