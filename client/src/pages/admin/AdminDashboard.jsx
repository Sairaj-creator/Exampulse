import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Layers,
  BookMarked,
  ArrowRight,
  Calendar,
  Activity,
  Award,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { getAdminOverviewApi } from "../../features/analytics/api";
import { DailyActivityChart } from "../../features/analytics/DailyActivityChart";
import { SubjectBarChart } from "../../features/analytics/SubjectBarChart";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";

export function AdminDashboard() {
  const { user } = useAuth();

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: getAdminOverviewApi,
  });

  const usersByRole = overview?.usersByRole || { admin: 0, teacher: 0, student: 0 };
  const totalUsers = usersByRole.admin + usersByRole.teacher + usersByRole.student;

  const examsByStatus = overview?.examsByStatus || { draft: 0, published: 0, archived: 0 };
  const totalExams = examsByStatus.draft + examsByStatus.published + examsByStatus.archived;

  const total14DayAttempts = (overview?.attemptsPerDay || []).reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <AnalyticsLoadingState message="Loading platform analytics…" />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <AnalyticsErrorState
          message={error?.message || "Failed to load platform analytics."}
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
            <div className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-1">
              Platform Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-stone-500 mt-1 max-w-xl">
              Oversee platform security, manage user accounts and roles, and
              monitor system-wide assessment volumes and academic subject averages.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button asChild>
              <Link to="/admin/users" className="flex items-center gap-1.5">
                <Users size={16} /> Manage Users
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards Shell */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                User Directory
              </span>
              <Users size={18} className="text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {totalUsers}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {usersByRole.student} students · {usersByRole.teacher} teachers · {usersByRole.admin} admins
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Exam Pipeline
              </span>
              <Calendar size={18} className="text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {totalExams}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              {examsByStatus.published} published · {examsByStatus.draft} drafts
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                14-Day Attempts
              </span>
              <Activity size={18} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {total14DayAttempts}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Chronological platform submissions
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Subjects
              </span>
              <Award size={18} className="text-amber-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview?.avgBySubject?.length ?? 0}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Disciplines with graded attempts
            </div>
          </div>
        </div>

        {/* Charts: Daily Submission Activity & Subject Means */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyActivityChart
            data={overview?.attemptsPerDay || []}
            height={280}
            title="System Submission Activity (Last 14 Days)"
          />
          <SubjectBarChart
            data={overview?.avgBySubject || []}
            height={280}
            title="Course Performance Benchmarks"
          />
        </div>

        {/* Administration Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h2 className="text-base font-bold text-stone-900 mb-1">
                User Management
              </h2>
              <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                Create teachers and administrators, manage student accounts,
                reset passwords, and toggle active status.
              </p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              Access user directory <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h2 className="text-base font-bold text-stone-900 mb-1">
                Batch Management
              </h2>
              <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                Configure student cohorts and academic years. Guarded deletion
                prevents removing active batches.
              </p>
            </div>
            <Link
              to="/admin/batches"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Access batches <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <BookMarked size={20} />
              </div>
              <h2 className="text-base font-bold text-stone-900 mb-1">
                Subject Catalogue
              </h2>
              <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                Maintain course subjects and department codes used across
                question banks and assessments.
              </p>
            </div>
            <Link
              to="/admin/subjects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Access subjects <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default AdminDashboard;
