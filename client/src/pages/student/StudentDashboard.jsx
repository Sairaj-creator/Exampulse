import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  BarChart3,
  Award,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { getStudentAnalyticsApi } from "../../features/analytics/api";
import { TrendChart } from "../../features/analytics/TrendChart";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";

export function StudentDashboard() {
  const { user } = useAuth();

  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student-analytics", "me"],
    queryFn: () => getStudentAnalyticsApi("me"),
  });

  const overview = analytics?.overview || {
    examsTaken: 0,
    averagePercentage: 0,
    bestScore: 0,
    latestScore: 0,
  };

  const improvement = analytics?.improvement || {
    available: false,
    delta: 0,
    direction: "neutral",
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <AnalyticsLoadingState message="Loading your performance dashboard…" />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <AnalyticsErrorState
          message={error?.message || "Failed to load your performance dashboard."}
          onRetry={refetch}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              Student Workspace · {user?.batchId?.name || "Assigned Batch"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-stone-500 mt-1 max-w-xl">
              Access scheduled assessments, review your evaluation reports, and
              track your topic-level mastery.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="outline">
              <Link to="/student/analytics" className="flex items-center gap-2">
                <BarChart3 size={16} /> My Analytics
              </Link>
            </Button>
            <Button asChild>
              <Link to="/student/exams" className="flex items-center gap-2">
                Browse Exams <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards Shell */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Exams Taken
              </span>
              <BookOpenCheck size={18} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview.examsTaken}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Latest: <span className="font-semibold text-stone-700">{overview.latestScore}%</span>
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Performance Average
              </span>
              <Award size={18} className="text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview.averagePercentage}%
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Aggregated across attempts
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Peak Score
              </span>
              <Sparkles size={18} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview.bestScore}%
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Highest examination score
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                3-vs-3 Trajectory
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
                <span className="text-stone-400 text-base font-semibold">Building history</span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {improvement.available ? "Last 3 vs prior 3 exams" : `${overview.examsTaken}/6 exams taken`}
            </div>
          </div>
        </div>

        {/* Visual Trend vs Batch Average */}
        {(
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900">Assessment Trajectory</h2>
              <Link
                to="/student/analytics"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
              >
                View full analytics report <ArrowRight size={14} />
              </Link>
            </div>
            <TrendChart data={analytics?.trend || []} height={260} />
          </div>
        )}

        {/* Quick Links & Instructions Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 mb-2">
              Quick Navigation
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Explore your assigned assessments or inspect your comprehensive
              analytics report.
            </p>
            <div className="space-y-3">
              <Link
                to="/student/exams"
                className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-700/50 hover:bg-stone-50 transition-all text-sm font-semibold text-stone-800"
              >
                <span className="flex items-center gap-3">
                  <BookOpenCheck size={18} className="text-emerald-700" />
                  Upcoming & Live Exams
                </span>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
              <Link
                to="/student/analytics"
                className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-700/50 hover:bg-stone-50 transition-all text-sm font-semibold text-stone-800"
              >
                <span className="flex items-center gap-3">
                  <BarChart3 size={18} className="text-purple-700" />
                  Topic Mastery & Performance Trends
                </span>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 mb-2">
              Exam Integrity Notice
            </h2>
            <ul className="text-xs text-stone-600 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
              <li>
                All assessments enforce strict server-side timing synchronized
                with official clock intervals.
              </li>
              <li>
                Every option response is automatically persisted in real-time as
                you select it.
              </li>
              <li>
                Disconnecting or refreshing mid-exam preserves your timer state
                and answered questions.
              </li>
              <li>
                Attempt expiration triggers automatic submission and instant
                grading evaluation.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default StudentDashboard;
