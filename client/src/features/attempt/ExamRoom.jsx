import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldAlert, LayoutGrid } from "lucide-react";
import { useCountdown } from "./useCountdown";
import { useAutosave } from "./useAutosave";
import { Timer } from "./Timer";
import { SaveIndicator } from "./SaveIndicator";
import { QuestionPanel } from "./QuestionPanel";
import { Palette } from "./Palette";
import { SubmitDialog } from "./SubmitDialog";
import { recordAttemptEventApi, submitAttemptApi } from "./api";
import { Button } from "../../components/ui/button";

export function ExamRoom({ attemptData }) {
  const navigate = useNavigate();
  const questions = attemptData?.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attemptData?.answers || []);
  const [tabSwitchCount, setTabSwitchCount] = useState(
    attemptData?.tabSwitchCount || 0,
  );
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAutoSubmit, setIsAutoSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const autoSubmitTriggeredRef = useRef(false);

  // Auto-submit callback when countdown expires
  const handleTimeExpire = useCallback(() => {
    setIsAutoSubmit(true);
    setIsSubmitOpen(true);
  }, []);

  const { secondsLeft, formattedTime, isExpired, syncRemaining } = useCountdown(
    {
      expiresAt: attemptData?.expiresAt,
      serverNow: attemptData?.serverNow,
      onExpire: handleTimeExpire,
    },
  );

  const { saveStatus, queueSave, flushPending } = useAutosave({
    attemptId: attemptData?.attemptId,
    onSaveSuccess: (response) => {
      if (response?.remainingSeconds !== undefined) {
        syncRemaining(response.remainingSeconds);
      }
    },
    onSaveError: (err) => {
      if (err?.code === "ATTEMPT_EXPIRED") {
        handleTimeExpire();
      }
    },
  });

  // Current question data
  const currentQuestion = questions[currentIndex] || null;
  const currentQuestionIdStr = currentQuestion?._id?.toString();

  const currentAnswer = useMemo(() => {
    if (!currentQuestionIdStr) return null;
    return answers.find(
      (a) =>
        (a.questionId?._id
          ? a.questionId._id.toString()
          : a.questionId?.toString()) === currentQuestionIdStr,
    );
  }, [answers, currentQuestionIdStr]);

  const selectedKeys = useMemo(
    () => currentAnswer?.selectedKeys || [],
    [currentAnswer],
  );
  const markedForReview = Boolean(currentAnswer?.markedForReview);

  // Option selection logic
  const handleSelectOption = useCallback(
    (key) => {
      if (!currentQuestion) return;

      let nextSelectedKeys;
      if (currentQuestion.type === "multiple") {
        nextSelectedKeys = selectedKeys.includes(key)
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];
      } else {
        // Single or truefalse
        nextSelectedKeys = [key];
      }

      // Update local answers optimistically
      setAnswers((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (a) =>
            (a.questionId?._id
              ? a.questionId._id.toString()
              : a.questionId?.toString()) === currentQuestionIdStr,
        );
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            selectedKeys: nextSelectedKeys,
          };
        } else {
          next.push({
            questionId: currentQuestion._id,
            selectedKeys: nextSelectedKeys,
            markedForReview,
          });
        }
        return next;
      });

      queueSave(currentQuestion._id, {
        selectedKeys: nextSelectedKeys,
        markedForReview,
      });
    },
    [
      currentQuestion,
      currentQuestionIdStr,
      selectedKeys,
      markedForReview,
      queueSave,
    ],
  );

  // Clear answer logic
  const handleClearAnswer = useCallback(() => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (a) =>
          (a.questionId?._id
            ? a.questionId._id.toString()
            : a.questionId?.toString()) === currentQuestionIdStr,
      );
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          selectedKeys: [],
        };
      }
      return next;
    });

    queueSave(currentQuestion._id, {
      selectedKeys: [],
      markedForReview,
    });
  }, [currentQuestion, currentQuestionIdStr, markedForReview, queueSave]);

  // Toggle mark for review
  const handleToggleReview = useCallback(() => {
    if (!currentQuestion) return;
    const nextMarked = !markedForReview;

    setAnswers((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (a) =>
          (a.questionId?._id
            ? a.questionId._id.toString()
            : a.questionId?.toString()) === currentQuestionIdStr,
      );
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          markedForReview: nextMarked,
        };
      } else {
        next.push({
          questionId: currentQuestion._id,
          selectedKeys: [],
          markedForReview: nextMarked,
        });
      }
      return next;
    });

    queueSave(currentQuestion._id, {
      selectedKeys,
      markedForReview: nextMarked,
    });
  }, [
    currentQuestion,
    currentQuestionIdStr,
    markedForReview,
    selectedKeys,
    queueSave,
  ]);

  // Tab switch listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && !submittedResult) {
        try {
          const res = await recordAttemptEventApi(
            attemptData.attemptId,
            "tab_hidden",
          );
          setTabSwitchCount(res.tabSwitchCount);
          setTabSwitchWarning(true);
        } catch {
          // Ignore network errors on background events
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [attemptData.attemptId, submittedResult]);

  // Unload guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submittedResult) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submittedResult]);

  // Final submission action. Manual submission waits for the autosave queue.
  const handleFinalSubmit = useCallback(
    async (options = {}) => {
      if (isSubmitting || submittedResult) return;
      const automatic = options?.automatic === true;
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const flushed = await flushPending();
        if (!flushed && !automatic) {
          setSubmitError(
            "Some answers could not be saved. Check your connection and submit again.",
          );
          return;
        }
        const response = await submitAttemptApi(attemptData.attemptId);
        setSubmittedResult(response.result);
        setIsSubmitOpen(false);
      } catch (err) {
        if (["ALREADY_SUBMITTED", "ATTEMPT_EXPIRED"].includes(err?.code)) {
          navigate("/student/exams");
        } else {
          setSubmitError(
            err?.message || "Submission failed. Please try again.",
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      attemptData.attemptId,
      flushPending,
      isSubmitting,
      navigate,
      submittedResult,
    ],
  );

  useEffect(() => {
    if (isAutoSubmit && !autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true;
      void handleFinalSubmit({ automatic: true });
    }
  }, [handleFinalSubmit, isAutoSubmit]);

  // If already submitted in this session, render completion screen
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-stone-900">
              Exam Submitted Successfully
            </h1>
            <p className="text-sm text-stone-500">
              Your responses for <strong>{attemptData.examTitle}</strong> have
              been graded and recorded.
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                Your Score
              </span>
              <span className="text-2xl font-bold text-stone-900 mt-1 block">
                {submittedResult.score} / {submittedResult.totalMarks}
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block">
                Percentage
              </span>
              <span
                className={`text-2xl font-bold mt-1 block ${
                  submittedResult.passed ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {submittedResult.percentage}%
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Button asChild className="w-full">
              <Link to={`/student/attempts/${attemptData.attemptId}/result`}>
                View Detailed Result & Review
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/student/exams">Return to My Exams</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Sticky Focus Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-stone-900 truncate">
            {attemptData.examTitle}
          </h1>
          <SaveIndicator saveStatus={saveStatus} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
            className="lg:hidden font-semibold text-xs gap-1.5"
            aria-label="Toggle Question Palette"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Palette</span>
            <span className="text-[11px] text-stone-500 font-mono">
              ({currentIndex + 1}/{totalQuestions})
            </span>
          </Button>
          <Timer secondsLeft={secondsLeft} formattedTime={formattedTime} />
          <Button
            type="button"
            size="sm"
            onClick={() => setIsSubmitOpen(true)}
            className="font-semibold text-xs"
          >
            Submit Exam
          </Button>
        </div>
      </header>

      {/* Tab Switch Warning Toast/Banner */}
      {tabSwitchWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-700" />
            <span>
              <strong>Integrity Notice:</strong> Window unfocused. Tab switches
              are audited ({tabSwitchCount} recorded).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTabSwitchWarning(false)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Area (8 cols on large) */}
        <section className="lg:col-span-8 min-h-[420px] lg:h-[calc(100vh-140px)]">
          <QuestionPanel
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            selectedKeys={selectedKeys}
            markedForReview={markedForReview}
            onSelectOption={handleSelectOption}
            onClearAnswer={handleClearAnswer}
            onToggleReview={handleToggleReview}
            onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => {
              if (currentIndex < totalQuestions - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                setIsSubmitOpen(true);
              }
            }}
            hasPrevious={currentIndex > 0}
            hasNext={currentIndex < totalQuestions - 1}
          />
        </section>

        {/* Palette Area (4 cols on large, collapsible on mobile) */}
        <aside
          className={`lg:col-span-4 min-h-[380px] lg:h-[calc(100vh-140px)] ${
            mobilePaletteOpen ? "block" : "hidden lg:block"
          }`}
        >
          <Palette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectIndex={(idx) => {
              setCurrentIndex(idx);
              setMobilePaletteOpen(false);
            }}
            onSubmitClick={() => setIsSubmitOpen(true)}
          />
        </aside>
      </main>

      {/* Confirmation & Expiry Dialog */}
      <SubmitDialog
        open={isSubmitOpen}
        onOpenChange={setIsSubmitOpen}
        questions={questions}
        answers={answers}
        onConfirmSubmit={handleFinalSubmit}
        isSubmitting={isSubmitting}
        isAutoSubmit={isAutoSubmit || isExpired}
        error={submitError}
      />
    </div>
  );
}
