import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Button } from "../../components/ui/button";
import {
  getStudentExamInstructionsApi,
  startOrResumeAttemptApi,
} from "../../features/attempt/api";

export function ExamInstructionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function loadInstructions() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentExamInstructionsApi(id);
        setExam(data);
      } catch (err) {
        setError(err?.message || "Failed to load examination instructions");
      } finally {
        setLoading(false);
      }
    }
    loadInstructions();
  }, [id]);

  const handleStartExam = async () => {
    if (!agreed && exam?.attemptStatus !== "in_progress") return;
    setStarting(true);
    try {
      const res = await startOrResumeAttemptApi(id);
      navigate(`/student/attempts/${res.attemptId}/take`);
    } catch (err) {
      setError(err?.message || "Could not launch examination attempt");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-stone-400 mx-auto" />
          <p className="text-sm text-stone-500">Loading exam guidelines…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !exam) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4 my-8">
          <AlertTriangle size={32} className="text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">Unable to Open Exam</h2>
          <p className="text-xs text-rose-800">{error || "Exam not found"}</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/student/exams">Return to My Exams</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isLive = exam.phase === "live";
  const inProgress = exam.attemptStatus === "in_progress";
  const isSubmitted = exam.attemptStatus === "submitted";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/student/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Assigned Exams
        </Link>

        {/* Title Header */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              {exam.subject?.name || "Subject"} · {exam.subject?.code || "SUB"}
            </span>

            {isSubmitted ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Completed
              </span>
            ) : inProgress ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
                Attempt In Progress
              </span>
            ) : isLive ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Live Now
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Upcoming Window
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {exam.title}
          </h1>

          {exam.description && (
            <p className="text-sm text-stone-600 leading-relaxed">
              {exam.description}
            </p>
          )}

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-500 font-medium block">
                Duration
              </span>
              <span className="text-base font-bold text-stone-900 block mt-0.5">
                {exam.effectiveDurationMinutes || exam.durationMinutes} mins
              </span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-500 font-medium block">
                Total Marks
              </span>
              <span className="text-base font-bold text-stone-900 block mt-0.5">
                {exam.totalMarks} Marks
              </span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-500 font-medium block">
                Questions
              </span>
              <span className="text-base font-bold text-stone-900 block mt-0.5">
                {exam.questionCount} Questions
              </span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[11px] text-stone-500 font-medium block">
                Pass Mark
              </span>
              <span className="text-base font-bold text-stone-900 block mt-0.5">
                {exam.passPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Rules Checklist */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-700" />
            <h2 className="text-lg font-bold text-stone-900">
              Examination Guidelines & Protocols
            </h2>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
            <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Server-Authoritative Timer:</strong> Your countdown begins
                immediately upon clicking start. The clock runs continuously on the
                central server and will not pause if you close or refresh your tab.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Real-Time Autosave:</strong> Every option you click is
                persisted immediately in the cloud. You do not need to manually save
                each answer.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <FileText size={16} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong>Marking Policy:</strong>{" "}
                {exam.negativeMarking?.enabled ? (
                  <span>
                    Negative marking is active: wrong answers incur a{" "}
                    <strong>{exam.negativeMarking.penaltyFraction * 100}%</strong>{" "}
                    deduction of question marks. Unanswered questions carry zero penalty.
                  </span>
                ) : (
                  <span>
                    No negative marking is applied for incorrect answers.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <AlertTriangle size={16} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <strong>Tab Switching & Audit Notice:</strong> Switching browser
                tabs or minimizing this window is logged and attached to your
                submission report for teacher integrity review.
              </div>
            </div>
          </div>

          {exam.instructions && (
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Teacher's Specific Instructions
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-wrap bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl">
                {exam.instructions}
              </p>
            </div>
          )}

          {/* Agreement Checkbox */}
          {!isSubmitted && (
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agree-checkbox"
                  checked={agreed || inProgress}
                  disabled={inProgress}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-md border-stone-300 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                />
                <label
                  htmlFor="agree-checkbox"
                  className="text-xs sm:text-sm font-medium text-stone-800 cursor-pointer select-none"
                >
                  I have read, understood, and agree to abide by all the examination
                  rules and server-timed protocols stated above.
                </label>
              </div>
            </div>
          )}

          {/* Launch Action */}
          <div className="pt-2">
            {isSubmitted ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {exam.attemptId && (
                  <Button asChild className="flex-1 font-bold py-6 text-sm">
                    <Link to={`/student/attempts/${exam.attemptId}/result`}>
                      View Detailed Result & Review
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className={exam.attemptId ? "flex-1 py-6 text-sm" : "w-full"}
                >
                  <Link to="/student/exams">Return to My Exams</Link>
                </Button>
              </div>
            ) : !isLive ? (
              <Button disabled className="w-full">
                Exam Window Is Not Live
              </Button>
            ) : inProgress ? (
              <Button
                type="button"
                onClick={handleStartExam}
                disabled={starting}
                className="w-full gap-2 font-bold py-6 text-sm"
              >
                {starting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Resuming Attempt…
                  </>
                ) : (
                  <>
                    Resume In-Progress Exam <ArrowRight size={16} />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartExam}
                disabled={!agreed || starting}
                className="w-full gap-2 font-bold py-6 text-sm shadow-xs"
              >
                {starting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Initializing Attempt…
                  </>
                ) : (
                  <>
                    Start Exam Now <ArrowRight size={16} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
