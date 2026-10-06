import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  Clock,
  Award,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  RotateCw,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { listStudentExamsApi } from "../../features/attempt/api";

export function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("live"); // "live" | "upcoming" | "completed"

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudentExamsApi();
      setExams(data);
    } catch (err) {
      setError(err?.message || "Failed to load assigned exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const liveExams = exams.filter(
    (e) => e.phase === "live" && e.attemptStatus !== "submitted",
  );
  const upcomingExams = exams.filter(
    (e) => e.phase === "upcoming" && e.attemptStatus !== "submitted",
  );
  const completedExams = exams.filter(
    (e) => e.attemptStatus === "submitted" || e.phase === "ended",
  );

  const displayedExams =
    activeTab === "live"
      ? liveExams
      : activeTab === "upcoming"
        ? upcomingExams
        : completedExams;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Assigned Examinations
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Live, upcoming, and completed assessments assigned to your batch.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadExams}
            disabled={loading}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "live"
                ? "border-emerald-700 text-emerald-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Now ({liveExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "upcoming"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Upcoming ({upcomingExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "completed"
                ? "border-stone-800 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Completed ({completedExams.length})
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-stone-200 rounded-md w-1/3" />
                <div className="h-6 bg-stone-200 rounded-md w-3/4" />
                <div className="h-4 bg-stone-200 rounded-md w-1/2" />
                <div className="h-10 bg-stone-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle size={28} className="text-rose-600 mx-auto" />
            <p className="text-sm font-medium text-rose-800">{error}</p>
            <Button size="sm" variant="outline" onClick={loadExams}>
              Try Again
            </Button>
          </div>
        ) : displayedExams.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
            <BookOpenCheck size={36} className="text-stone-400 mx-auto" />
            <h2 className="text-base font-bold text-stone-800">
              No {activeTab} examinations found
            </h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {activeTab === "live"
                ? "There are currently no active exams open for your batch. Check Upcoming for scheduled tests."
                : activeTab === "upcoming"
                  ? "No upcoming assessments have been scheduled for your batch yet."
                  : "You haven't completed any assessments yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedExams.map((exam) => {
              const isLive = exam.phase === "live";
              const isSubmitted = exam.attemptStatus === "submitted";
              const inProgress = exam.attemptStatus === "in_progress";

              return (
                <div
                  key={exam._id}
                  className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-stone-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        {exam.subject?.name || "Subject"}
                        {exam.subject?.code ? ` (${exam.subject.code})` : ""}
                      </span>

                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 size={12} /> Graded
                        </span>
                      ) : inProgress ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          In Progress
                        </span>
                      ) : isLive ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          Live
                        </span>
                      ) : exam.phase === "ended" ? (
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          Ended
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-stone-900 leading-snug line-clamp-2">
                      {exam.title}
                    </h2>

                    {exam.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    )}

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-stone-400" />
                        <span>{exam.durationMinutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={14} className="text-stone-400" />
                        <span>
                          {exam.totalMarks} Marks ({exam.questionCount} Qs)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Score pill if submitted */}
                  {isSubmitted && exam.result && (
                    <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">
                        Result:
                      </span>
                      <span className="font-bold text-stone-900">
                        {exam.result.score} / {exam.result.totalMarks} (
                        {exam.result.percentage}%)
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <div>
                    {isSubmitted ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-xs font-semibold"
                      >
                        <Link
                          to={
                            exam.attemptId
                              ? `/student/attempts/${exam.attemptId}/result`
                              : `/student/exams/${exam._id}`
                          }
                        >
                          View Result & Review
                        </Link>
                      </Button>
                    ) : isLive ? (
                      <Button
                        asChild
                        className="w-full gap-2 text-xs font-semibold"
                      >
                        <Link to={`/student/exams/${exam._id}`}>
                          {inProgress ? (
                            <>
                              Resume Exam <ArrowRight size={14} />
                            </>
                          ) : (
                            <>
                              Start Exam <PlayCircle size={14} />
                            </>
                          )}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-xs font-semibold"
                      >
                        <Link to={`/student/exams/${exam._id}`}>
                          Instructions & Schedule
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
