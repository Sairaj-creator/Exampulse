import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Clock, Trophy } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import { Leaderboard } from "../../features/results/Leaderboard";
import { getExamLeaderboardApi } from "../../features/results/api";

export function LeaderboardPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await getExamLeaderboardApi(id);
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLeaderboard();
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
            Tabulating final competition standings…
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    const isLocked = error.code === "EXAM_NOT_ENDED";

    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-5 shadow-xs">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isLocked
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {isLocked ? <Clock size={32} /> : <AlertCircle size={32} />}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-stone-900">
              {isLocked ? "Leaderboard Locked" : "Unable to Open Standings"}
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isLocked
                ? "Official candidate standings are released automatically after the scheduled examination window ends for all students."
                : error.message || "Could not retrieve competition results."}
            </p>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link to="/student/exams">Return to My Exams</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          to="/student/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Assigned Exams
        </Link>

        <Leaderboard
          topEntries={data.topEntries || []}
          myEntry={data.myEntry}
          totalParticipants={data.totalParticipants || 0}
          examTitle={data.examTitle}
        />
      </div>
    </DashboardLayout>
  );
}
