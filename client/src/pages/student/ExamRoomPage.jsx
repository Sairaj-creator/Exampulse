import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ExamRoom } from "../../features/attempt/ExamRoom";
import { getAttemptStateApi } from "../../features/attempt/api";
import { Button } from "../../components/ui/button";

export function ExamRoomPage() {
  const { id } = useParams();
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAttempt() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptStateApi(id);
        if (isMounted) setAttemptData(data);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAttempt();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 size={36} className="animate-spin text-stone-500" />
        <div className="text-center">
          <h2 className="text-base font-bold text-stone-900">
            Connecting to Exam Room…
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Synchronizing timer and preparing your questions.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAlreadySubmitted =
      error.code === "ALREADY_SUBMITTED" || error.code === "ATTEMPT_EXPIRED";

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-8 text-center space-y-5 shadow-xs">
          {isAlreadySubmitted ? (
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
          ) : (
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl mx-auto flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-stone-900">
              {isAlreadySubmitted
                ? "Exam Already Completed"
                : "Unable to Access Exam Room"}
            </h1>
            <p className="text-xs text-stone-500">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link to="/student/exams">Return to Assigned Exams</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <ExamRoom attemptData={attemptData} />;
}
