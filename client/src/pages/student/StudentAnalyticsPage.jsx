import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
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
import { getStudentAnalyticsApi } from "../../features/analytics/api";
import { TrendChart } from "../../features/analytics/TrendChart";
import { SubjectBarChart } from "../../features/analytics/SubjectBarChart";
import { TopicStrengthList } from "../../features/analytics/TopicStrengthList";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";

export function StudentAnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-analytics", "me"],
    queryFn: () => getStudentAnalyticsApi("me"),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <AnalyticsLoadingState message="Loading learning analytics…" />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <AnalyticsErrorState
          message={error?.message || "Failed to load performance analytics."}
          onRetry={refetch}
        />
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
        <PageHeader
          eyebrow="Performance Intelligence · Student Analytics"
          title="Comprehensive Learning Analytics"
          description="Chronological score trajectory, peer cohort benchmarks, course breakdowns, and topic mastery."
        />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Exams Completed */}
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

          {/* Card 2: Average Score */}
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

          {/* Card 3: 3-vs-3 Trajectory */}
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

          {/* Card 4: Time Utilization */}
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

        {/* Charts Section: Trend vs Cohort & Subject Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            data={data?.trend || []}
            height={300}
            title="Score Trajectory vs Cohort Batch"
          />
          <SubjectBarChart
            data={subjects}
            height={300}
            title="Subject Performance Distribution"
          />
        </div>

        {/* Topic Strengths & Weaknesses */}
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
export default StudentAnalyticsPage;
