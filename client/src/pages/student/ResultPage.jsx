import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  AlertCircle,
  FileCheck2,
  RotateCw,
  Printer,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { ScoreRing } from "../../features/results/ScoreRing";
import { ResultSummary } from "../../features/results/ResultSummary";
import { ReviewList } from "../../features/results/ReviewList";
import { TopicBreakdown } from "../../features/results/TopicBreakdown";
import { getAttemptResultApi } from "../../features/results/api";
import { useAuth } from "../../hooks/useAuth";

export function ResultPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isStudent = user?.role === "student";
  const fallbackPath = isStudent ? "/student/exams" : "/teacher/exams";

  useEffect(() => {
    let isMounted = true;
    async function loadResult() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAttemptResultApi(id);
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted)
          setError(err?.message || "Failed to load examination result.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadResult();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-stone-400 mx-auto" />
          <p className="text-sm text-stone-500 font-medium">
            Generating examination performance report…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-12 bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle size={36} className="text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">
            Unable to Load Result
          </h2>
          <p className="text-xs text-rose-800">{error || "Result not found"}</p>
          <Button asChild variant="outline" size="sm">
            <Link to={fallbackPath}>
              {isStudent ? "Return to My Exams" : "Return to Exams"}
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const result = data.result || {};
  const backPath = isStudent
    ? "/student/exams"
    : `/teacher/exams/${data.examId}`;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={14} />
            {isStudent ? "Back to Assigned Exams" : "Back to Submissions"}
          </Link>

          <div className="flex items-center gap-2 no-print">
            {isStudent && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Link to={`/student/exams/${data.examId}/leaderboard`}>
                  <Trophy size={14} className="text-amber-600" />
                  View Leaderboard
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer size={14} />
              Print Report
            </Button>
          </div>
        </div>

        {/* Header Title Banner */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              Assessment Report · {data.subject?.name || "Subject"}
              {!isStudent && data.student?.name
                ? ` · ${data.student.name}`
                : ""}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {data.examTitle}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Submitted on {new Date(data.submittedAt).toLocaleString()} ·
              Recorded via {data.submitReason || "manual"} submission
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                result.passed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {result.passed ? "PASSED" : "FAILED"}
            </span>
          </div>
        </div>

        {/* Score Ring & Metric Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-4 flex">
            <div className="w-full">
              <ScoreRing
                score={result.score}
                totalMarks={result.totalMarks}
                percentage={result.percentage}
                passed={result.passed}
              />
            </div>
          </div>
          <div className="md:col-span-8 flex flex-col justify-center">
            <ResultSummary
              correctCount={result.correctCount}
              wrongCount={result.wrongCount}
              unansweredCount={result.unansweredCount}
              timeTakenSeconds={result.timeTakenSeconds}
              ranking={data.ranking}
            />
          </div>
        </div>

        {data.allowFullReview && (
          <TopicBreakdown evaluations={result.evaluations || []} />
        )}

        {/* Question Review Section */}
        <section className="pt-4 border-t border-stone-200">
          <ReviewList
            evaluations={result.evaluations || []}
            allowFullReview={data.allowFullReview}
            reviewPolicy={data.reviewPolicy}
            reviewAvailableAt={data.reviewAvailableAt}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
