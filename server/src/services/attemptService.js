import { Attempt } from "../models/Attempt.js";
import { Exam } from "../models/Exam.js";
import { ApiError } from "../utils/response.js";
import { gradeAttempt } from "./gradingService.js";

/**
 * Fisher-Yates array shuffle helper.
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Starts a new exam attempt or resumes an existing in-progress attempt.
 * Enforces live window, batch assignment, and uniqueness.
 */
export async function startOrResumeAttempt({ examId, user }) {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  if (exam.status !== "published") {
    throw new ApiError(400, "BAD_REQUEST", "Exam is not published");
  }

  // Check batch assignment
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
  if (now < exam.startTime || now > exam.endTime) {
    throw new ApiError(409, "EXAM_NOT_LIVE", "Exam is not currently live");
  }

  // Check existing attempt
  let existing = await Attempt.findOne({ examId, studentId: user._id });
  if (existing) {
    if (existing.status === "submitted") {
      throw new ApiError(
        409,
        "ALREADY_SUBMITTED",
        "You have already submitted this exam",
        { attemptId: existing._id },
      );
    }

    if (now > existing.expiresAt) {
      existing = await finalizeAttempt(existing._id, "timeout");
      throw new ApiError(
        409,
        "ALREADY_SUBMITTED",
        "This attempt has expired and been submitted",
        { attemptId: existing._id },
      );
    }

    return { attemptId: existing._id, resumed: true };
  }

  // Calculate expiresAt = min(startedAt + duration, endTime)
  const startedAt = new Date();
  const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
  const potentialExpiry = new Date(startedAt.getTime() + durationMs);
  const expiresAt =
    potentialExpiry < exam.endTime ? potentialExpiry : exam.endTime;

  // Prepare presentation
  let examQuestions = [...exam.questions];
  if (exam.shuffleQuestions) {
    examQuestions = shuffleArray(examQuestions);
  }

  const presentation = examQuestions.map((q) => {
    let optionOrder = q.options.map((o) => o.key);
    if (exam.shuffleOptions) {
      optionOrder = shuffleArray(optionOrder);
    }
    return {
      questionId: q._id,
      optionOrder,
    };
  });

  try {
    const attempt = await Attempt.create({
      examId: exam._id,
      studentId: user._id,
      subjectId: exam.subjectId,
      teacherId: exam.createdBy,
      batchId: user.batchId?._id || user.batchId,
      examTitle: exam.title,
      status: "in_progress",
      startedAt,
      expiresAt,
      presentation,
      answers: [],
      tabSwitchCount: 0,
    });

    return { attemptId: attempt._id, resumed: false };
  } catch (err) {
    // Handle double-click race condition (duplicate key error 11000)
    if (err.code === 11000) {
      const raced = await Attempt.findOne({ examId, studentId: user._id });
      if (raced) {
        if (raced.status === "submitted" || now > raced.expiresAt) {
          throw new ApiError(
            409,
            "ALREADY_SUBMITTED",
            "Exam attempt already submitted",
            { attemptId: raced._id },
          );
        }
        return { attemptId: raced._id, resumed: true };
      }
    }
    throw err;
  }
}

/**
 * Returns exam room payload for an active attempt.
 * Strips correct answer keys and explanations to prevent leaks.
 */
export async function getAttemptState({ attemptId, user }) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  if (
    user.role === "student" &&
    attempt.studentId.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "FORBIDDEN", "You do not own this attempt");
  }

  const now = new Date();
  if (attempt.status === "in_progress" && now > attempt.expiresAt) {
    await finalizeAttempt(attempt._id, "timeout");
    throw new ApiError(
      410,
      "ATTEMPT_EXPIRED",
      "Attempt has expired and has been submitted",
      { attemptId: attempt._id },
    );
  }

  if (attempt.status === "submitted") {
    throw new ApiError(
      409,
      "ALREADY_SUBMITTED",
      "This attempt has already been submitted",
      { attemptId: attempt._id },
    );
  }

  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  // Build sanitized questions in presentation order
  const questionMap = new Map(exam.questions.map((q) => [q._id.toString(), q]));

  const sanitizedQuestions = attempt.presentation
    .map((item) => {
      const q = questionMap.get(item.questionId.toString());
      if (!q) return null;

      let orderedOptions = [...q.options];
      if (item.optionOrder && item.optionOrder.length > 0) {
        const optMap = new Map(q.options.map((opt) => [opt.key, opt]));
        orderedOptions = item.optionOrder
          .map((k) => optMap.get(k))
          .filter(Boolean);
      }

      // CRITICAL: NEVER leak correctKeys or explanation
      return {
        _id: q._id,
        type: q.type,
        text: q.text,
        options: orderedOptions.map((opt) => ({
          key: opt.key,
          text: opt.text,
        })),
        topic: q.topic || "",
        difficulty: q.difficulty || "medium",
        marks: q.marks || 1,
      };
    })
    .filter(Boolean);

  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000),
  );

  return {
    attemptId: attempt._id,
    examId: attempt.examId,
    examTitle: attempt.examTitle,
    instructions: exam.instructions,
    negativeMarking: exam.negativeMarking,
    passPercentage: exam.passPercentage,
    totalMarks: exam.totalMarks,
    durationMinutes: exam.durationMinutes,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    remainingSeconds,
    serverNow: new Date().toISOString(),
    questions: sanitizedQuestions,
    answers: attempt.answers || [],
    tabSwitchCount: attempt.tabSwitchCount || 0,
  };
}

/**
 * Saves a student's answer for a question.
 * Verifies grace period (expiresAt + 5s) and valid option keys.
 */
export async function saveAnswer({
  attemptId,
  questionId,
  selectedKeys = [],
  markedForReview,
  user,
}) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  if (attempt.studentId.toString() !== user._id.toString()) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  if (attempt.status !== "in_progress") {
    throw new ApiError(
      409,
      "ALREADY_SUBMITTED",
      "Attempt is already submitted",
    );
  }

  // Grace period check (expiresAt + 5000ms)
  const now = Date.now();
  const expireMs = new Date(attempt.expiresAt).getTime();
  if (now > expireMs + 5000) {
    await finalizeAttempt(attempt._id, "timeout");
    throw new ApiError(
      410,
      "ATTEMPT_EXPIRED",
      "Attempt time has expired; answer cannot be accepted",
    );
  }

  const exam = await Exam.findById(attempt.examId);
  const targetQuestion = exam?.questions.find(
    (q) => q._id.toString() === questionId.toString(),
  );
  if (!targetQuestion) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "Question does not belong to this exam",
    );
  }

  // Validate selected keys are subset of options
  const validKeys = new Set(targetQuestion.options.map((o) => o.key));
  for (const k of selectedKeys) {
    if (!validKeys.has(k)) {
      throw new ApiError(400, "BAD_REQUEST", `Invalid option key '${k}'`);
    }
  }

  if (
    (targetQuestion.type === "single" || targetQuestion.type === "truefalse") &&
    selectedKeys.length > 1
  ) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "Only one option can be selected for this question type",
    );
  }

  const existingIndex = attempt.answers.findIndex(
    (a) => a.questionId.toString() === questionId.toString(),
  );

  const reviewFlag =
    typeof markedForReview === "boolean"
      ? markedForReview
      : existingIndex >= 0
        ? attempt.answers[existingIndex].markedForReview
        : false;

  const answeredAt = new Date();
  let writeResult;
  if (existingIndex >= 0) {
    writeResult = await Attempt.updateOne(
      {
        _id: attempt._id,
        studentId: user._id,
        status: "in_progress",
        "answers.questionId": targetQuestion._id,
      },
      {
        $set: {
          "answers.$.selectedKeys": selectedKeys,
          "answers.$.markedForReview": reviewFlag,
          "answers.$.answeredAt": answeredAt,
        },
      },
    );
  } else {
    writeResult = await Attempt.updateOne(
      {
        _id: attempt._id,
        studentId: user._id,
        status: "in_progress",
        "answers.questionId": { $ne: targetQuestion._id },
      },
      {
        $push: {
          answers: {
            questionId: targetQuestion._id,
            selectedKeys,
            markedForReview: reviewFlag,
            answeredAt,
          },
        },
      },
    );

    if (writeResult.matchedCount === 0) {
      writeResult = await Attempt.updateOne(
        {
          _id: attempt._id,
          studentId: user._id,
          status: "in_progress",
          "answers.questionId": targetQuestion._id,
        },
        {
          $set: {
            "answers.$.selectedKeys": selectedKeys,
            "answers.$.markedForReview": reviewFlag,
            "answers.$.answeredAt": answeredAt,
          },
        },
      );
    }
  }

  if (writeResult.matchedCount === 0) {
    throw new ApiError(
      409,
      "ALREADY_SUBMITTED",
      "Attempt is already submitted",
    );
  }

  const remainingSeconds = Math.max(
    0,
    Math.floor((expireMs - Date.now()) / 1000),
  );

  return {
    savedAt: new Date().toISOString(),
    remainingSeconds,
    questionId,
    selectedKeys,
    markedForReview: reviewFlag,
  };
}

/**
 * Records an attempt event (e.g., tab switch count increment).
 */
export async function recordEvent({ attemptId, type, user }) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  if (attempt.studentId.toString() !== user._id.toString()) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  if (attempt.status === "in_progress" && new Date() > attempt.expiresAt) {
    await finalizeAttempt(attempt._id, "timeout");
    throw new ApiError(
      410,
      "ATTEMPT_EXPIRED",
      "Attempt has expired and has been submitted",
      { attemptId: attempt._id },
    );
  }

  if (attempt.status === "in_progress" && type === "tab_hidden") {
    const updated = await Attempt.findOneAndUpdate(
      { _id: attemptId, studentId: user._id, status: "in_progress" },
      { $inc: { tabSwitchCount: 1 } },
      { new: true },
    );
    if (!updated) {
      throw new ApiError(
        409,
        "ALREADY_SUBMITTED",
        "Attempt is already submitted",
      );
    }
    return { tabSwitchCount: updated.tabSwitchCount };
  }

  return { tabSwitchCount: attempt.tabSwitchCount };
}

/**
 * Submits an attempt for its owning student. Repeated submissions are idempotent.
 */
export async function submitAttempt({ attemptId, user }) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }
  if (attempt.studentId.toString() !== user._id.toString()) {
    throw new ApiError(403, "FORBIDDEN", "You do not own this attempt");
  }
  const reason = new Date() > attempt.expiresAt ? "timeout" : "manual";
  return finalizeAttempt(attempt._id, reason);
}

/**
 * Finalizes and evaluates an attempt. Idempotent single source of truth.
 */
export async function finalizeAttempt(attemptId, reason = "manual") {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  if (attempt.status === "submitted") {
    return attempt;
  }

  const exam = await Exam.findById(attempt.examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  const result = gradeAttempt({
    examQuestions: exam.questions,
    answers: attempt.answers,
    rules: {
      negativeMarking: exam.negativeMarking,
      passPercentage: exam.passPercentage,
      totalMarks: exam.totalMarks,
    },
    startedAt: attempt.startedAt,
    submittedAt: new Date(),
    expiresAt: attempt.expiresAt,
  });

  const updated = await Attempt.findOneAndUpdate(
    { _id: attemptId, status: "in_progress" },
    {
      $set: {
        status: "submitted",
        submitReason: reason,
        submittedAt: new Date(),
        result,
      },
    },
    { new: true },
  );

  return updated || (await Attempt.findById(attemptId));
}

/**
 * Sweeps and finalizes expired in-progress attempts.
 */
export async function finalizeExpired(examId = null) {
  const query = {
    status: "in_progress",
    expiresAt: { $lt: new Date(Date.now() - 5000) },
  };
  if (examId) {
    query.examId = examId;
  }

  const expiredAttempts = await Attempt.find(query).select("_id");
  for (const att of expiredAttempts) {
    await finalizeAttempt(att._id, "timeout");
  }
  return expiredAttempts.length;
}

/**
 * Returns submissions for an exam (teacher or admin view).
 * Lazily finalizes expired attempts first.
 */
export async function getExamSubmissions({ examId, user }) {
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

  // Lazy sweeper: finalize expired attempts before reporting
  await finalizeExpired(exam._id);

  const attempts = await Attempt.find({ examId })
    .populate("studentId", "name email rollNumber")
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  return attempts.map((a) => ({
    _id: a._id,
    student: a.studentId
      ? {
          _id: a.studentId._id,
          name: a.studentId.name,
          email: a.studentId.email,
          rollNumber: a.studentId.rollNumber,
        }
      : null,
    status: a.status,
    submitReason: a.submitReason,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    tabSwitchCount: a.tabSwitchCount || 0,
    score: a.result?.score ?? null,
    totalMarks: a.result?.totalMarks ?? exam.totalMarks,
    percentage: a.result?.percentage ?? null,
    passed: a.result?.passed ?? null,
    timeTakenSeconds: a.result?.timeTakenSeconds ?? null,
  }));
}

/**
 * Resets a student's attempt (allowed only while the exam is live).
 */
export async function resetAttempt({ examId, attemptId, user }) {
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

  const now = new Date();
  if (now < exam.startTime || now > exam.endTime) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Attempt reset is only permitted while the exam is live",
    );
  }

  const deleted = await Attempt.findOneAndDelete({ _id: attemptId, examId });
  if (!deleted) {
    throw new ApiError(404, "NOT_FOUND", "Attempt not found");
  }

  console.info(
    `[attempt-reset] teacher=${user._id} exam=${exam._id} attempt=${deleted._id} student=${deleted.studentId}`,
  );

  return { reset: true, attemptId };
}
