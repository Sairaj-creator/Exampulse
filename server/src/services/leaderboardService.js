import { Attempt } from "../models/Attempt.js";
import { Exam } from "../models/Exam.js";
import { ApiError } from "../utils/response.js";
import { finalizeExpired } from "./attemptService.js";

/**
 * Computes standard competition ranking (1, 2, 2, 4) and percentiles
 * across all submitted attempts for an exam.
 */
export async function computeExamRanking(examId) {
  const attempts = await Attempt.find({ examId, status: "submitted" })
    .populate("studentId", "name email rollNumber")
    .sort({ "result.score": -1, "result.timeTakenSeconds": 1, _id: 1 })
    .lean();

  if (attempts.length === 0) {
    return [];
  }

  let currentRank = 1;
  const rankedAttempts = attempts.map((att, idx) => {
    if (idx > 0) {
      const prev = attempts[idx - 1];
      const sameScore = att.result?.score === prev.result?.score;
      const sameTime =
        att.result?.timeTakenSeconds === prev.result?.timeTakenSeconds;
      if (!sameScore || !sameTime) {
        currentRank = idx + 1;
      }
    }
    return {
      ...att,
      rank: currentRank,
    };
  });

  const totalAttempts = rankedAttempts.length;
  return rankedAttempts.map((att) => {
    const lowerScoreCount = rankedAttempts.filter(
      (other) => (other.result?.score ?? 0) < (att.result?.score ?? 0),
    ).length;

    // Percentile = (attempts with lower score / total attempts) * 100
    const percentile =
      totalAttempts > 0
        ? Math.round((lowerScoreCount / totalAttempts) * 10000) / 100
        : 100;

    return {
      ...att,
      percentile,
    };
  });
}

/**
 * Retrieves the exam leaderboard with policy timing checks for students.
 */
export async function getExamLeaderboard({ examId, user, limit = 10 }) {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  const now = new Date();

  if (user.role === "student") {
    // Verify student is assigned to this exam's batch
    const studentBatchIdStr = user.batchId?._id
      ? user.batchId._id.toString()
      : user.batchId?.toString();
    const isAssigned = exam.batchIds.some(
      (b) => (b?._id ? b._id.toString() : b.toString()) === studentBatchIdStr,
    );
    if (!isAssigned) {
      throw new ApiError(403, "FORBIDDEN", "You are not assigned to this exam");
    }

    // Leaderboard is only visible to students after the exam window ends (§15.5)
    if (now < exam.endTime) {
      throw new ApiError(
        403,
        "EXAM_NOT_ENDED",
        "Leaderboard is only visible after the exam window has ended",
      );
    }
  } else if (user.role === "teacher") {
    if (exam.createdBy.toString() !== user._id.toString()) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  }

  await finalizeExpired(exam._id);
  const ranked = await computeExamRanking(examId);

  const parsedLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const topEntries = ranked.slice(0, parsedLimit).map((a) => ({
    rank: a.rank,
    attemptId: a._id,
    student: a.studentId
      ? {
          _id: a.studentId._id,
          name: a.studentId.name,
          rollNumber: a.studentId.rollNumber,
        }
      : null,
    score: a.result?.score ?? 0,
    totalMarks: a.result?.totalMarks ?? exam.totalMarks,
    percentage: a.result?.percentage ?? 0,
    passed: a.result?.passed ?? false,
    timeTakenSeconds: a.result?.timeTakenSeconds ?? 0,
    percentile: a.percentile,
  }));

  let myEntry = null;
  if (user.role === "student") {
    const userAttempt = ranked.find(
      (a) =>
        (a.studentId?._id
          ? a.studentId._id.toString()
          : a.studentId?.toString()) === user._id.toString(),
    );
    if (userAttempt) {
      myEntry = {
        rank: userAttempt.rank,
        attemptId: userAttempt._id,
        score: userAttempt.result?.score ?? 0,
        totalMarks: userAttempt.result?.totalMarks ?? exam.totalMarks,
        percentage: userAttempt.result?.percentage ?? 0,
        passed: userAttempt.result?.passed ?? false,
        timeTakenSeconds: userAttempt.result?.timeTakenSeconds ?? 0,
        percentile: userAttempt.percentile,
      };
    }
  }

  return {
    examId: exam._id,
    examTitle: exam.title,
    endTime: exam.endTime,
    totalParticipants: ranked.length,
    topEntries,
    myEntry,
  };
}
