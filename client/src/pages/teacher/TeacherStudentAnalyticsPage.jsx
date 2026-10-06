import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Minus,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/ui/button";
import { getStudentAnalyticsApi } from "../../features/analytics/api";
import { TrendChart } from "../../features/analytics/TrendChart";
import { SubjectBarChart } from "../../features/analytics/SubjectBarChart";
import { TopicStrengthList } from "../../features/analytics/TopicStrengthList";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";

export function TeacherStudentAnalyticsPage() {
  const { id } = useParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-student-analytics", id],
    queryFn: () => getStudentAnalyticsApi(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <AnalyticsLoadingState message="Loading student performance profile…" />
      </DashboardLayout>
    );
  }

  if (isError) {
    const isForbidden = error?.response?.status === 403 || error?.status === 403;
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/teacher" className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back to Faculty Dashboard
            </Link>
          </Button>
          <AnalyticsErrorState
            message={
              isForbidden
                ? "You can only inspect analytics for students who have submitted attempts on assessments you created."
                : error?.message || "Unable to fetch student analytics profile."
            }
            onRetry={refetch}
          />
        </div>
      </DashboardLayout>
    );
  }

  const overview = data?.overview || {
    examsTaken: 0,
    averagePercentage: 0,
    bestScore: 0,
    latestScore: 0,
  };

  const improvement = data?.improvement || {
    available: false,
    delta: 0,
    direction: "neutral",
  };

  const timeEff = data?.timeEfficiency || {
    averageTimeTakenSeconds: 0,
    averageDurationSeconds: 0,
    efficiencyPercentage: 0,
  };
  const subjects = data?.subjects || [];
  const topics = data?.topics || {
    strengths: [],
    weaknesses: [],
    insufficientData: [],
  };

  const avgMinutes = Math.round((timeEff.averageTimeTakenSeconds || 0) / 60);
  const durMinutes = Math.round((timeEff.averageDurationSeconds || 0) / 60);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm">
            <Link to="/teacher" className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back to Faculty Dashboard
            </Link>
          </Button>
        </div>

        <PageHeader
          eyebrow="Faculty Inspection · Student Performance Drilldown"
          title="Student Assessment Diagnostic"
          description="Detailed historical exam trajectory, peer batch comparison, and subject/topic mastery."
        />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Exams Completed
              </span>
              <BookOpenCheck size={18} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview.examsTaken}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Latest score: <span className="font-semibold text-stone-700">{overview.latestScore}%</span>
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Overall Average
              </span>
              <Award size={18} className="text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview.averagePercentage}%
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Peak performance: <span className="font-semibold text-stone-700">{overview.bestScore}%</span>
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Recent Trajectory
              </span>
              {improvement.direction === "up" ? (
                <TrendingUp size={18} className="text-emerald-600" />
              ) : improvement.direction === "down" ? (
                <TrendingDown size={18} className="text-rose-600" />
              ) : (
                <Minus size={18} className="text-stone-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {improvement.available ? (
                <span className={improvement.delta >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {improvement.delta > 0 ? `+${improvement.delta}%` : `${improvement.delta}%`}
                </span>
              ) : (
                <span className="text-stone-500 text-lg">In progress</span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {improvement.available ? (
                `Last 3 exams vs previous 3 (${improvement.recentAvg}% vs ${improvement.previousAvg}%)`
              ) : (
                `Requires ${improvement.requiredAttempts || 6} exams for 3-vs-3 metric (${overview.examsTaken}/${improvement.requiredAttempts || 6})`
              )}
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Time Utilization
              </span>
              <Clock size={18} className="text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {timeEff.efficiencyPercentage}%
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {avgMinutes} min avg / {durMinutes || "--"} min duration
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            data={data?.trend || []}
            height={300}
            title="Candidate Trajectory vs Batch Cohort"
          />
          <SubjectBarChart
            data={subjects}
            height={300}
            title="Subject-Wise Performance"
          />
        </div>

        {/* Topic Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Topic-Level Diagnostic</h2>
              <p className="text-xs text-stone-500">
                Automatic threshold analysis: Strengths (&ge;75%) and Areas for Improvement (&lt;50%) with &ge;5 attempts
              </p>
            </div>
            {topics.insufficientData?.length > 0 && (
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Sparkles size={14} className="text-stone-400" />
                {topics.insufficientData.length} pending qualification (&lt;5 questions)
              </span>
            )}
          </div>

          <TopicStrengthList
            topics={topics}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
export default TeacherStudentAnalyticsPage;
