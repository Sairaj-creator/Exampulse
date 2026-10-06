import { Exam } from "../models/Exam.js";
import { Attempt } from "../models/Attempt.js";
import { ApiError } from "../utils/response.js";
import { finalizeAttempt } from "./attemptService.js";

/**
 * Lists published exams assigned to the student's batch, annotated with attempt status.
 */
export async function listStudentExams({ user, phase }) {
  const batchId = user.batchId?._id || user.batchId;
  if (!batchId) {
    return [];
  }

  const query = {
    status: "published",
    batchIds: batchId,
  };

  const exams = await Exam.find(query)
    .populate("subjectId", "name code")
    .sort({ startTime: 1 })
    .lean();

  if (exams.length === 0) {
    return [];
  }

  const examIds = exams.map((e) => e._id);
  let attempts = await Attempt.find({
    studentId: user._id,
    examId: { $in: examIds },
  }).lean();

  const now = new Date();
  const expired = attempts.filter(
    (attempt) =>
      attempt.status === "in_progress" && now > new Date(attempt.expiresAt),
  );
  if (expired.length) {
    await Promise.all(
      expired.map((attempt) => finalizeAttempt(attempt._id, "timeout")),
    );
    attempts = await Attempt.find({
      studentId: user._id,
      examId: { $in: examIds },
    }).lean();
  }

  const attemptMap = new Map(attempts.map((a) => [a.examId.toString(), a]));

  let formatted = exams.map((exam) => {
    let computedPhase = "upcoming";
    if (now >= exam.startTime && now <= exam.endTime) {
      computedPhase = "live";
    } else if (now > exam.endTime) {
      computedPhase = "ended";
    }

    const attempt = attemptMap.get(exam._id.toString());
    let attemptStatus = "not_started";
    if (attempt) {
      attemptStatus = attempt.status; // "in_progress" or "submitted"
    }

    return {
      _id: exam._id,
      title: exam.title,
      description: exam.description || "",
      subject: exam.subjectId
        ? {
            _id: exam.subjectId._id,
            name: exam.subjectId.name,
            code: exam.subjectId.code,
          }
        : null,
      startTime: exam.startTime,
      endTime: exam.endTime,
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      questionCount: exam.questions?.length || 0,
      phase: computedPhase,
      attemptStatus,
      attemptId: attempt?._id || null,
      result:
        attempt?.status === "submitted" && attempt?.result
          ? {
              score: attempt.result.score,
              totalMarks: attempt.result.totalMarks,
              percentage: attempt.result.percentage,
              passed: attempt.result.passed,
            }
          : null,
    };
  });

  if (phase) {
    formatted = formatted.filter((e) => e.phase === phase);
  }

  return formatted;
}

/**
 * Returns exam rules and metadata for instructions screen (anti-leak: no questions).
 */
export async function getStudentExamInstructions({ examId, user }) {
  const exam = await Exam.findById(examId).populate("subjectId", "name code");
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  if (exam.status !== "published") {
    throw new ApiError(404, "NOT_FOUND", "Exam is not published");
  }

  const studentBatchIdStr = user.batchId?._id
    ? user.batchId._id.toString()
    : user.batchId?.toString();
  const isAssigned = exam.batchIds.some(
    (b) => (b?._id ? b._id.toString() : b.toString()) === studentBatchIdStr,
  );
  if (!isAssigned) {
    throw new ApiError(403, "FORBIDDEN", "You are not assigned to this exam");
  }

  const now = new Date();
  const windowRemainingMinutes = Math.max(
    0,
    Math.ceil((exam.endTime.getTime() - now.getTime()) / 60000),
  );
  const effectiveDurationMinutes = Math.min(
    exam.durationMinutes,
    windowRemainingMinutes,
  );

  const attempt = await Attempt.findOne({ examId, studentId: user._id });

  return {
    _id: exam._id,
    title: exam.title,
    description: exam.description || "",
    instructions: exam.instructions || "",
    subject: exam.subjectId
      ? {
          _id: exam.subjectId._id,
          name: exam.subjectId.name,
          code: exam.subjectId.code,
        }
      : null,
    startTime: exam.startTime,
    endTime: exam.endTime,
    durationMinutes: exam.durationMinutes,
    effectiveDurationMinutes,
    totalMarks: exam.totalMarks,
    questionCount: exam.questions?.length || 0,
    passPercentage: exam.passPercentage,
    negativeMarking: exam.negativeMarking,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    reviewPolicy: exam.reviewPolicy,
    phase: exam.phase,
    attemptStatus: attempt ? attempt.status : "not_started",
    attemptId: attempt?._id || null,
  };
}
