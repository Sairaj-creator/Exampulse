import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Copy,
  FilePenLine,
  Send,
  Undo2,
  Download,
  RotateCcw,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Users,
  Eye,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PageHeader } from "../../components/common/PageHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import { ExamStatusBadge } from "../../features/exams/ExamStatusBadge";
import {
  archiveExamApi,
  duplicateExamApi,
  getExamApi,
  publishExamApi,
  unpublishExamApi,
} from "../../features/exams/api";
import {
  getExamSubmissionsApi,
  resetAttemptApi,
  exportExamCsvApi,
} from "../../features/results/api";
import {
  getExamAnalyticsApi,
  getExamQuestionsAnalyticsApi,
} from "../../features/analytics/api";
import { ScoreHistogram } from "../../features/analytics/ScoreHistogram";
import { PassFailDonut } from "../../features/analytics/PassFailDonut";
import { QuestionStatsTable } from "../../features/analytics/QuestionStatsTable";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";
import { BarChart3 } from "lucide-react";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

const formatTime = (secs) => {
  if (secs === null || secs === undefined) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

export function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "submissions"
  const [resetTarget, setResetTarget] = useState(null);

  const query = useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExamApi(id),
  });

  const submissionsQuery = useQuery({
    queryKey: ["examSubmissions", id],
    queryFn: () => getExamSubmissionsApi(id),
    enabled: activeTab === "submissions",
  });

  const analyticsQuery = useQuery({
    queryKey: ["examAnalytics", id],
    queryFn: () => getExamAnalyticsApi(id),
    enabled: activeTab === "analytics",
  });

  const questionAnalyticsQuery = useQuery({
    queryKey: ["examQuestionAnalytics", id],
    queryFn: () => getExamQuestionsAnalyticsApi(id),
    enabled: activeTab === "analytics",
  });

  const action = useMutation({
    mutationFn: async (type) => {
      if (type === "publish") return publishExamApi(id);
      if (type === "unpublish") return unpublishExamApi(id);
      if (type === "archive") return archiveExamApi(id);
      return duplicateExamApi(id);
    },
    onSuccess: (exam, type) => {
      toast.success(
        type === "duplicate"
          ? "Draft copy created"
          : `Exam ${type === "unpublish" ? "returned to draft" : `${type}d`}`,
      );
      setConfirm("");
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (type === "duplicate") navigate(`/teacher/exams/${exam._id}/edit`);
    },
    onError: (error) => toast.error(error.message || "Exam action failed"),
  });

  const resetMutation = useMutation({
    mutationFn: (attemptId) => resetAttemptApi(id, attemptId),
    onSuccess: () => {
      toast.success("Attempt has been reset. Candidate may retake.");
      setResetTarget(null);
      queryClient.invalidateQueries({ queryKey: ["examSubmissions", id] });
      queryClient.invalidateQueries({ queryKey: ["exam", id] });
    },
    onError: (err) => toast.error(err.message || "Failed to reset attempt"),
  });

  const handleExportCsv = async () => {
    try {
      const blob = await exportExamCsvApi(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `exam-${id}-results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV export downloaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to export CSV");
    }
  };

  if (query.isLoading)
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          Loading exam…
        </div>
      </DashboardLayout>
    );

  if (query.isError)
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {query.error.message || "Could not load exam."}
        </div>
      </DashboardLayout>
    );

  const exam = query.data;
  const submissions = submissionsQuery.data || [];
  const isLive = exam.phase === "live";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${exam.subjectId?.code || "Exam"} · ${exam.questions.length} questions`}
          title={exam.title}
          description={exam.description || "No description provided."}
          action={
            <div className="flex flex-wrap gap-2">
              <ExamStatusBadge status={exam.status} phase={exam.phase} />
              {exam.status === "draft" && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/teacher/exams/${exam._id}/edit`}>
                    <FilePenLine size={14} /> Edit draft
                  </Link>
                </Button>
              )}
            </div>
          }
        />

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total marks", exam.totalMarks],
            ["Duration", `${exam.durationMinutes} min`],
            ["Pass mark", `${exam.passPercentage}%`],
            ["Attempts", exam.attemptCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "overview"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Overview & Paper
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "submissions"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Submissions ({exam.attemptCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "analytics"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <BarChart3 size={15} /> Analytics
          </button>
        </div>

        {/* Tab 1: Overview & Question Snapshot */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="text-base font-bold text-stone-900">Overview</h2>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-stone-500">Window</dt>
                    <dd className="mt-1 font-semibold">
                      {formatDate(exam.startTime)}
                      <br />
                      to {formatDate(exam.endTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Assigned batches</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {(exam.batchIds || []).map((batch) => (
                        <span
                          key={batch._id}
                          className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold"
                        >
                          {batch.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Review policy</dt>
                    <dd className="mt-1 font-semibold capitalize">
                      {exam.reviewPolicy.replace("_", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Paper rules</dt>
                    <dd className="mt-1 font-semibold">
                      {exam.shuffleQuestions
                        ? "Questions shuffled"
                        : "Fixed question order"}{" "}
                      ·{" "}
                      {exam.shuffleOptions
                        ? "Options shuffled"
                        : "Fixed option order"}
                      <br />
                      {exam.negativeMarking?.enabled
                        ? `${exam.negativeMarking.penaltyFraction}× negative marking`
                        : "No negative marking"}
                    </dd>
                  </div>
                </dl>
                {exam.instructions && (
                  <div className="mt-5 border-t border-stone-200 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                      Instructions
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                      {exam.instructions}
                    </p>
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-5 py-4">
                  <h2 className="text-base font-bold text-stone-900">
                    Question snapshot
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    This is the immutable paper candidates will receive.
                  </p>
                </div>
                <ol className="divide-y divide-stone-100">
                  {exam.questions.map((question, index) => (
                    <li key={question._id} className="flex gap-4 p-5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-6 text-stone-900">
                          {question.text}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {question.topic} · {question.type} ·{" "}
                          {question.difficulty}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        {question.marks} marks
                      </span>
                    </li>
                  ))}
                  {exam.questions.length === 0 && (
                    <li className="p-10 text-center text-sm text-stone-500">
                      No questions have been added.
                    </li>
                  )}
                </ol>
              </section>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4">
              {exam.status === "draft" && (
                <Button size="sm" onClick={() => setConfirm("publish")}>
                  <Send size={14} /> Publish
                </Button>
              )}
              {exam.status === "published" && exam.attemptCount === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm("unpublish")}
                >
                  <Undo2 size={14} /> Unpublish
                </Button>
              )}
              {exam.status === "published" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirm("archive")}
                >
                  <Archive size={14} /> Archive
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => action.mutate("duplicate")}
                disabled={action.isPending}
              >
                <Copy size={14} /> Duplicate as draft
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Candidate Submissions */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-stone-200 rounded-2xl p-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Candidate Submissions
                </h2>
                <p className="text-xs text-stone-500">
                  Review student performance, evaluate scores, audit tab
                  switches, and export results.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                disabled={submissions.length === 0}
                className="gap-2 text-xs font-semibold"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>

            {submissionsQuery.isLoading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-sm text-stone-500">
                Loading candidate submissions…
              </div>
            ) : submissionsQuery.isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-800">
                  {submissionsQuery.error?.message ||
                    "Could not load candidate submissions."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => submissionsQuery.refetch()}
                >
                  Try Again
                </Button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-2">
                <Users size={32} className="text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700">
                  No submissions recorded yet
                </p>
                <p className="text-xs text-stone-500">
                  Submissions appear here as students complete or time out of
                  the exam.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50/75 border-b border-stone-200 text-stone-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-center">Time Taken</th>
                        <th className="py-3 px-4 text-center">Tab Switches</th>
                        <th className="py-3 px-4">Submitted At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {submissions.map((sub) => {
                        const hasHighTabSwitches = sub.tabSwitchCount >= 3;

                        return (
                          <tr
                            key={sub._id}
                            className="hover:bg-stone-50/60 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-stone-900">
                                {sub.student?.name || "Student"}
                              </div>
                              <div className="text-xs text-stone-400">
                                {sub.student?.email}
                                {sub.student?.rollNumber
                                  ? ` · Roll ${sub.student.rollNumber}`
                                  : ""}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  sub.status === "submitted"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-stone-900">
                              {sub.score !== null
                                ? `${sub.score} / ${sub.totalMarks}`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {sub.percentage !== null ? (
                                <span
                                  className={
                                    sub.passed
                                      ? "text-emerald-700"
                                      : "text-rose-700"
                                  }
                                >
                                  {sub.percentage}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-xs text-stone-600 font-mono">
                              {formatTime(sub.timeTakenSeconds)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {hasHighTabSwitches ? (
                                <span
                                  title="High tab switch count (potential academic integrity concern)"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"
                                >
                                  <ShieldAlert
                                    size={12}
                                    className="text-amber-600"
                                  />
                                  {sub.tabSwitchCount} (flagged)
                                </span>
                              ) : (
                                <span className="text-xs text-stone-500">
                                  {sub.tabSwitchCount}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-stone-500">
                              {sub.submittedAt
                                ? new Date(sub.submittedAt).toLocaleString()
                                : "In Progress"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                {sub.status === "submitted" && (
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1.5 text-xs"
                                  >
                                    <Link
                                      to={`/teacher/attempts/${sub._id}/result`}
                                    >
                                      <Eye size={12} /> View
                                    </Link>
                                  </Button>
                                )}
                                {isLive && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setResetTarget(sub)}
                                    className="text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 gap-1.5"
                                  >
                                    <RotateCcw size={12} /> Reset
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics & Item Analysis */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {analyticsQuery.isLoading || questionAnalyticsQuery.isLoading ? (
              <AnalyticsLoadingState message="Loading exam analytics…" />
            ) : analyticsQuery.isError || questionAnalyticsQuery.isError ? (
              <AnalyticsErrorState
                message={
                  analyticsQuery.error?.message ||
                  questionAnalyticsQuery.error?.message ||
                  "Failed to load exam analytics."
                }
                onRetry={() => {
                  analyticsQuery.refetch();
                  questionAnalyticsQuery.refetch();
                }}
              />
            ) : (
              (() => {
                const ea = analyticsQuery.data;
                const stats = ea?.stats || { average: 0, median: 0, standardDeviation: 0, highest: 0, lowest: 0 };
                const part = ea?.participation || { eligibleCount: 0, attemptedCount: 0, submittedCount: 0, participationRate: 0 };
                const timeData = ea?.avgTime || { averageTimeTakenSeconds: 0, durationSeconds: 0 };
                const flagged = ea?.flagged || { count: 0, attempts: [], threshold: 3 };

                return (
                  <div className="space-y-6">
                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Participation Rate
                        </p>
                        <p className="mt-2 text-2xl font-bold text-stone-900">
                          {part.participationRate}%
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          {part.submittedCount} of {part.eligibleCount} candidates submitted
                        </p>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Cohort Mean Score
                        </p>
                        <p className="mt-2 text-2xl font-bold text-stone-900">
                          {stats.average}%
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          Median: {stats.median}% · Std Dev: ±{stats.standardDeviation}%
                        </p>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Pass Clearance
                        </p>
                        <p className="mt-2 text-2xl font-bold text-stone-900">
                          {ea?.passRate?.passPercentage ?? 0}%
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          {ea?.passRate?.passedCount ?? 0} passed / {ea?.passRate?.failedCount ?? 0} failed
                        </p>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Average Time Taken
                        </p>
                        <p className="mt-2 text-2xl font-bold text-stone-900">
                          {Math.round((timeData.averageTimeTakenSeconds || 0) / 60)} min
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">
                          Allocated: {Math.round((timeData.durationSeconds || 0) / 60)} min duration
                        </p>
                      </div>
                    </div>

                    {/* Anti-Cheat / Integrity Alert */}
                    {flagged.count > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-xs">
                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                          <ShieldAlert size={18} className="text-amber-700" />
                          <span>Exam Integrity: {flagged.count} Candidate{flagged.count === 1 ? "" : "s"} Flagged</span>
                        </div>
                        <p className="text-xs text-amber-800 mb-3">
                          The following submissions recorded {flagged.threshold}+ tab-switch or window blur events during active invigilation:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {flagged.attempts.map((fa) => (
                            <div
                              key={fa.attemptId}
                              className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2"
                            >
                              <span className="font-semibold text-stone-900">{fa.student?.name || "Student"}</span>
                              <span className="font-mono text-[10px] text-stone-500">({fa.student?.rollNumber || "No Roll"})</span>
                              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                {fa.tabSwitchCount} switches
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Score Distribution & Clearance Rate Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ScoreHistogram data={ea?.distribution || []} />
                      <PassFailDonut passRate={ea?.passRate || { passedCount: 0, failedCount: 0, passPercentage: 0 }} />
                    </div>

                    {/* Question Analytics / Item Analysis */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-stone-900">Item Analysis & Discrimination Index</h3>
                        <p className="text-xs text-stone-500">
                          Item difficulty index, observed vs tagged difficulty comparison, distractor option frequency, and item discrimination index (D)
                        </p>
                      </div>
                      <QuestionStatsTable questions={questionAnalyticsQuery.data || []} />
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Dialogs */}
        <ConfirmDialog
          open={Boolean(confirm)}
          title={`${confirm ? confirm[0].toUpperCase() + confirm.slice(1) : "Update"} this exam?`}
          description={
            confirm === "publish"
              ? "The exam becomes available to assigned batches during its scheduled window."
              : confirm === "archive"
                ? "The exam moves out of the active lifecycle."
                : "The exam returns to draft for full editing."
          }
          confirmLabel={confirm || "Confirm"}
          busy={action.isPending}
          onClose={() => setConfirm("")}
          onConfirm={() => action.mutate(confirm)}
        />

        <ConfirmDialog
          open={Boolean(resetTarget)}
          title="Reset Candidate Attempt?"
          description={`Resetting ${resetTarget?.student?.name || "this student"}'s attempt will delete their current responses and allow them to take the exam again from scratch. Allowed only while the exam is live.`}
          confirmLabel="Reset Attempt"
          busy={resetMutation.isPending}
          onClose={() => setResetTarget(null)}
          onConfirm={() => resetMutation.mutate(resetTarget._id)}
        />
      </div>
    </DashboardLayout>
  );
}
