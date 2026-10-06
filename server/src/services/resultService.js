import { Attempt } from "../models/Attempt.js";
import { Exam } from "../models/Exam.js";
import { ApiError } from "../utils/response.js";
import { finalizeAttempt, finalizeExpired } from "./attemptService.js";
import { computeExamRanking } from "./leaderboardService.js";

async function loadAttempt(attemptId) {
  return Attempt.findById(attemptId)
    .populate("subjectId", "name code")
    .populate("studentId", "name email rollNumber");
}

/**
 * Returns detailed attempt result and per-question evaluations
 * according to the exam's reviewPolicy and schedule window.
 */
export async function getAttemptResult({ attemptId, user }) {
  let attempt = await loadAttempt(attemptId);

  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  if (
    attempt.status === "in_progress" &&
    Date.now() > new Date(attempt.expiresAt).getTime()
  ) {
    await finalizeAttempt(attempt._id, "timeout");
    attempt = await loadAttempt(attemptId);
  }

  if (attempt.status !== "submitted") {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "Attempt has not been submitted yet",
    );
  }

  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Associated exam not found");
  }

  // Ownership & access authorization
  if (user.role === "student") {
    const studentIdStr = attempt.studentId?._id
      ? attempt.studentId._id.toString()
      : attempt.studentId?.toString();
    if (studentIdStr !== user._id.toString()) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  } else if (user.role === "teacher") {
    if (exam.createdBy.toString() !== user._id.toString()) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  }

  // Review policy check
  const now = new Date();
  let allowFullReview = false;

  if (user.role === "teacher" || user.role === "admin") {
    allowFullReview = true;
  } else {
    if (exam.reviewPolicy === "immediate") {
      allowFullReview = true;
    } else if (exam.reviewPolicy === "after_end") {
      allowFullReview = now > exam.endTime;
    } else {
      // "never"
      allowFullReview = false;
    }
  }

  // A restricted policy means score-only: do not expose question-level
  // correctness because it can reveal answer keys one selection at a time.
  let evaluations = [];
  if (allowFullReview) {
    const questionMap = new Map(
      exam.questions.map((question) => [question._id.toString(), question]),
    );
    const evaluationMap = new Map(
      (attempt.result?.evaluations || []).map((evaluation) => [
        evaluation.questionId.toString(),
        evaluation,
      ]),
    );
    const presentation = attempt.presentation?.length
      ? attempt.presentation
      : (attempt.result?.evaluations || []).map((evaluation) => ({
          questionId: evaluation.questionId,
          optionOrder: [],
        }));

    evaluations = presentation
      .map((item, index) => {
        const questionId = item.questionId.toString();
        const evaluation = evaluationMap.get(questionId);
        const snapshot = questionMap.get(questionId);
        if (!evaluation || !snapshot) return null;

        const optionMap = new Map(
          snapshot.options.map((option) => [option.key, option]),
        );
        const orderedOptions = item.optionOrder?.length
          ? item.optionOrder.map((key) => optionMap.get(key)).filter(Boolean)
          : snapshot.options;

        return {
          questionNumber: index + 1,
          questionId: evaluation.questionId,
          sourceQuestionId: evaluation.sourceQuestionId,
          type: snapshot.type,
          text: snapshot.text,
          options: orderedOptions.map((option) => ({
            key: option.key,
            text: option.text,
          })),
          topic: evaluation.topic || snapshot.topic || "",
          difficulty: evaluation.difficulty || snapshot.difficulty || "medium",
          marks: snapshot.marks || 1,
          selectedKeys: evaluation.selectedKeys || [],
          correctKeys: evaluation.correctKeys || snapshot.correctKeys || [],
          isCorrect: evaluation.isCorrect,
          marksAwarded: evaluation.marksAwarded,
          explanation: snapshot.explanation || "",
        };
      })
      .filter(Boolean);
  }

  // Ranking and percentile visibility
  let ranking = null;
  const showRanking = user.role !== "student" || now > exam.endTime;
  if (showRanking) {
    const rankedAttempts = await computeExamRanking(exam._id);
    const myRanked = rankedAttempts.find(
      (r) => r._id.toString() === attempt._id.toString(),
    );
    if (myRanked) {
      ranking = {
        rank: myRanked.rank,
        percentile: myRanked.percentile,
        totalParticipants: rankedAttempts.length,
      };
    }
  }

  return {
    attemptId: attempt._id,
    examId: exam._id,
    examTitle: attempt.examTitle,
    subject: attempt.subjectId
      ? {
          _id: attempt.subjectId._id,
          name: attempt.subjectId.name,
          code: attempt.subjectId.code,
        }
      : null,
    student: attempt.studentId
      ? {
          _id: attempt.studentId._id,
          name: attempt.studentId.name,
          rollNumber: attempt.studentId.rollNumber,
        }
      : null,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    submitReason: attempt.submitReason,
    reviewPolicy: exam.reviewPolicy,
    reviewAvailableAt: exam.reviewPolicy === "after_end" ? exam.endTime : null,
    allowFullReview,
    ranking,
    result: {
      score: attempt.result?.score ?? 0,
      totalMarks: attempt.result?.totalMarks ?? exam.totalMarks,
      percentage: attempt.result?.percentage ?? 0,
      passed: attempt.result?.passed ?? false,
      correctCount: attempt.result?.correctCount ?? 0,
      wrongCount: attempt.result?.wrongCount ?? 0,
      unansweredCount: attempt.result?.unansweredCount ?? 0,
      timeTakenSeconds: attempt.result?.timeTakenSeconds ?? 0,
      evaluations,
    },
  };
}

/**
 * Returns student's personal history of submitted exam attempts.
 */
export async function getMySubmittedAttempts({ user }) {
  const attempts = await Attempt.find({
    studentId: user._id,
    status: "submitted",
  })
    .populate("subjectId", "name code")
    .sort({ submittedAt: -1 })
    .lean();

  return attempts.map((a) => ({
    _id: a._id,
    examId: a.examId,
    examTitle: a.examTitle,
    subject: a.subjectId
      ? {
          _id: a.subjectId._id,
          name: a.subjectId.name,
          code: a.subjectId.code,
        }
      : null,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    submitReason: a.submitReason,
    score: a.result?.score ?? 0,
    totalMarks: a.result?.totalMarks ?? 0,
    percentage: a.result?.percentage ?? 0,
    passed: a.result?.passed ?? false,
    timeTakenSeconds: a.result?.timeTakenSeconds ?? 0,
  }));
}

/**
 * Generates CSV export content for an exam's submissions.
 */
export async function exportExamResultsCsv({ examId, user }) {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  if (
    user.role === "teacher" &&
    exam.createdBy.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  await finalizeExpired(exam._id);
  const rankedAttempts = await computeExamRanking(examId);

  const headers = [
    "Rank",
    "Student Name",
    "Roll Number",
    "Email",
    "Score",
    "Total Marks",
    "Percentage",
    "Passed",
    "Time Taken (s)",
    "Tab Switches",
    "Submitted At",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const raw = String(val);
    const excelSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    const str = excelSafe.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = rankedAttempts.map((a) => [
    escapeCsv(a.rank),
    escapeCsv(a.studentId?.name || "N/A"),
    escapeCsv(a.studentId?.rollNumber || "N/A"),
    escapeCsv(a.studentId?.email || "N/A"),
    escapeCsv(a.result?.score ?? 0),
    escapeCsv(a.result?.totalMarks ?? exam.totalMarks),
    escapeCsv(a.result?.percentage ?? 0),
    escapeCsv(a.result?.passed ? "Passed" : "Failed"),
    escapeCsv(a.result?.timeTakenSeconds ?? 0),
    escapeCsv(a.tabSwitchCount ?? 0),
    escapeCsv(a.submittedAt ? new Date(a.submittedAt).toISOString() : ""),
  ]);

  const csvContent = `\uFEFF${[
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\r\n")}`;

  return {
    filename: `exam-${exam._id}-results.csv`,
    content: csvContent,
  };
}
