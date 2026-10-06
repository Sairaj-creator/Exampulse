import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Calendar,
  Users,
  Award,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { getTeacherOverviewApi } from "../../features/analytics/api";
import { AtRiskStudentsList } from "../../features/analytics/AtRiskStudentsList";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "../../features/analytics/AnalyticsQueryState";

const BATCH_COLORS = ["#059669", "#0284c7", "#7c3aed", "#d97706", "#dc2626"];

export function TeacherDashboard() {
  const { user } = useAuth();

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-overview"],
    queryFn: getTeacherOverviewApi,
  });

  const batchData = (overview?.batchComparison || []).map((b) => ({
    name: b.batchName || "Batch",
    Average: b.averagePercentage || 0,
    attempts: b.attemptCount || 0,
  }));

  if (isLoading) {
    return (
      <DashboardLayout>
        <AnalyticsLoadingState message="Loading faculty analytics…" />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <AnalyticsErrorState
          message={error?.message || "Failed to load faculty analytics."}
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
              Teacher Faculty Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-stone-500 mt-1 max-w-xl">
              Maintain your question repository, configure timed examinations,
              and inspect student cohort performance and at-risk candidates.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="outline">
              <Link
                to="/teacher/questions"
                className="flex items-center gap-1.5"
              >
                <Database size={16} /> Question Bank
              </Link>
            </Button>
            <Button asChild>
              <Link to="/teacher/exams/new" className="flex items-center gap-1.5">
                <Plus size={16} /> Create Exam
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Exams
              </span>
              <Calendar size={18} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview?.activeExams ?? 0}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Out of <span className="font-semibold text-stone-700">{overview?.totalExams ?? 0}</span> total exams
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Cohort Submissions
              </span>
              <Users size={18} className="text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview?.totalSubmissions ?? 0}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Auto-graded historical attempts
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Average Pass Rate
              </span>
              <Award size={18} className="text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview?.avgPassRate ?? 0}%
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Across all published exams
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                At-Risk Students
              </span>
              <AlertTriangle size={18} className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-stone-900">
              {overview?.atRisk?.length ?? 0}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Averaging below cutoff (&lt; 40%)
            </div>
          </div>
        </div>

        {/* Batch Performance & At-Risk Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohort Batch Comparison */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-700" />
                <h3 className="text-sm font-bold text-stone-900">Batch Cohort Performance</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Mean examination score across distinct classroom batches
              </p>
            </div>

            {batchData.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center text-stone-400 text-xs">
                No cohort submissions registered yet.
              </div>
            ) : (
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0ee" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const entry = payload[0].payload;
                          return (
                            <div className="bg-stone-900 text-white rounded-xl px-3 py-2 text-xs shadow-lg space-y-0.5">
                              <div className="font-bold text-stone-300">{entry.name}</div>
                              <div className="text-emerald-400 font-semibold">Average: {entry.Average}%</div>
                              <div className="text-stone-400 text-[10px]">{entry.attempts} attempt{entry.attempts === 1 ? "" : "s"}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Average" radius={[6, 6, 0, 0]}>
                      {batchData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BATCH_COLORS[index % BATCH_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* At-Risk Students List */}
          <AtRiskStudentsList atRisk={overview?.atRisk || []} />
        </div>

        {/* Recent Exams Table */}
        {overview?.recentExams && overview.recentExams.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Recent Examinations</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Latest assessment cycles with real-time pass rates and attempt volumes
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/teacher/exams" className="flex items-center gap-1 text-xs">
                  All Exams <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 font-semibold">Exam Title</th>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-center">Submissions</th>
                    <th className="pb-3 font-semibold text-center">Average</th>
                    <th className="pb-3 font-semibold text-center">Pass Rate</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {overview.recentExams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-stone-50/50 transition">
                      <td className="py-3 font-semibold text-stone-900">
                        <Link to={`/teacher/exams/${exam._id}`} className="hover:text-emerald-700">
                          {exam.title}
                        </Link>
                      </td>
                      <td className="py-3 text-stone-600">
                        {exam.subjectCode} - {exam.subjectName}
                      </td>
                      <td className="py-3 text-center">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                          {exam.status}
                        </span>
                      </td>
                      <td className="py-3 text-center font-semibold text-stone-800">
                        {exam.attemptCount}
                      </td>
                      <td className="py-3 text-center font-semibold text-stone-800">
                        {exam.averageScore}%
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-bold ${
                            exam.passRate >= 70
                              ? "text-emerald-700"
                              : exam.passRate >= 40
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {exam.passRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/teacher/exams/${exam._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-900"
                        >
                          Inspect <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Links & Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 mb-2">
              Assessment Management
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Construct high-integrity exams with question snapshots, negative
              marking, and shuffled sets.
            </p>
            <div className="space-y-3">
              <Link
                to="/teacher/questions"
                className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-700/50 hover:bg-stone-50 transition-all text-sm font-semibold text-stone-800"
              >
                <span className="flex items-center gap-3">
                  <Database size={18} className="text-emerald-700" />
                  Manage Question Repository
                </span>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
              <Link
                to="/teacher/exams"
                className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-emerald-700/50 hover:bg-stone-50 transition-all text-sm font-semibold text-stone-800"
              >
                <span className="flex items-center gap-3">
                  <Calendar size={18} className="text-blue-700" />
                  Exam Builder Stepper & Submissions
                </span>
                <ArrowRight size={16} className="text-stone-400" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#dfe3dc] rounded-2xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 mb-2">
              Assessment Architecture Key Features
            </h2>
            <ul className="text-xs text-stone-600 space-y-2 mt-3 list-disc pl-4 leading-relaxed">
              <li>
                Exams snapshot question papers upon creation, insulating past
                attempts from bank edits.
              </li>
              <li>
                Anti-cheat heuristics record tab-switches and window blur events
                for live invigilation.
              </li>
              <li>
                Automatic item analysis calculates discrimination indices and
                distractor selection frequencies.
              </li>
              <li>
                At-risk detection monitors low consecutive scores across active
                cohorts.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default TeacherDashboard;
