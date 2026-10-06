import mongoose from "mongoose";
import { Attempt, Batch, Exam, User, Subject } from "../models/index.js";
import { ApiError } from "../utils/response.js";
import { finalizeExpired } from "./attemptService.js";

// Helper math utilities
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + val, 0) / arr.length;
}

function round(val, decimals = 1) {
  if (val === null || val === undefined || Number.isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return round((sorted[mid - 1] + sorted[mid]) / 2, 1);
}

function calculateStdDev(arr) {
  if (!arr || arr.length <= 1) return 0;
  const meanVal = mean(arr);
  const variance =
    arr.reduce((acc, x) => acc + Math.pow(x - meanVal, 2), 0) / arr.length;
  return round(Math.sqrt(variance), 1);
}

const scoreBucketRanges = [
  "0-10",
  "10-20",
  "20-30",
  "30-40",
  "40-50",
  "50-60",
  "60-70",
  "70-80",
  "80-90",
  "90-100",
];

export function buildPercentageDistribution(percentages = []) {
  const counts = Array(10).fill(0);
  for (const value of percentages) {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    const bucketIndex = percentage === 100 ? 9 : Math.floor(percentage / 10);
    counts[bucketIndex] += 1;
  }
  return scoreBucketRanges.map((range, index) => ({
    range,
    count: counts[index],
  }));
}

export function calculateImprovement(attempts = []) {
  const base = {
    recentAvg: 0,
    previousAvg: null,
    delta: 0,
    direction: "neutral",
    available: false,
    requiredAttempts: 6,
  };

  if (attempts.length < 6) {
    const recent = attempts.slice(-3);
    return recent.length
      ? {
          ...base,
          recentAvg: round(
            mean(recent.map((attempt) => attempt.result?.percentage ?? 0)),
            1,
          ),
        }
      : base;
  }

  const recentAvg = round(
    mean(attempts.slice(-3).map((attempt) => attempt.result?.percentage ?? 0)),
    1,
  );
  const previousAvg = round(
    mean(
      attempts.slice(-6, -3).map((attempt) => attempt.result?.percentage ?? 0),
    ),
    1,
  );
  const delta = round(recentAvg - previousAvg, 1);
  return {
    recentAvg,
    previousAvg,
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
    available: true,
    requiredAttempts: 6,
  };
}

/**
 * 1. Student Analytics Bundle (§14.1, §15.6)
 * Returns overview, performance trend vs batch avg, subject performance,
 * topic strengths/weaknesses, improvement indicator, and time efficiency.
 */
export async function getStudentAnalytics({ studentId, user }) {
  const targetId = studentId === "me" ? user._id.toString() : studentId;

  const student = await User.findOne({ _id: targetId, role: "student" }).lean();
  if (!student) {
    throw new ApiError(404, "NOT_FOUND", "Student not found");
  }

  // Authorization check
  if (user.role === "student") {
    if (user._id.toString() !== targetId) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  } else if (user.role === "teacher") {
    // Teachers may inspect only students who actually attempted one of their exams.
    const hasAttemptOnTeacherExam = await Attempt.exists({
      studentId: targetId,
      teacherId: user._id,
    });
    if (!hasAttemptOnTeacherExam) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  }

  const targetObjectId = new mongoose.Types.ObjectId(targetId);

  const expiredExamIds = await Attempt.distinct("examId", {
    studentId: targetObjectId,
    status: "in_progress",
    expiresAt: { $lt: new Date() },
  });
  for (const examId of expiredExamIds) {
    await finalizeExpired(examId);
  }

  // Fetch student's submitted attempts in chronological order
  const attempts = await Attempt.find({
    studentId: targetObjectId,
    status: "submitted",
  })
    .sort({ submittedAt: 1 })
    .lean();

  const percentages = attempts.map((a) => a.result?.percentage ?? 0);

  // 1. Overview KPIs
  const overview = {
    examsTaken: attempts.length,
    averagePercentage: attempts.length > 0 ? round(mean(percentages), 1) : 0,
    bestScore: attempts.length > 0 ? Math.max(...percentages) : 0,
    latestScore: attempts.length > 0 ? percentages[percentages.length - 1] : 0,
  };

  // 2. Trend vs Batch Average
  const examIds = [...new Set(attempts.map((a) => a.examId.toString()))];
  let batchAvgMap = new Map();

  if (examIds.length > 0) {
    const batchAgg = await Attempt.aggregate([
      {
        $match: {
          examId: { $in: examIds.map((id) => new mongoose.Types.ObjectId(id)) },
          batchId: student.batchId,
          status: "submitted",
        },
      },
      {
        $group: {
          _id: "$examId",
          avgPct: { $avg: "$result.percentage" },
        },
      },
    ]);
    batchAvgMap = new Map(
      batchAgg.map((b) => [b._id.toString(), round(b.avgPct, 1)]),
    );
  }

  const trend = attempts.map((a) => ({
    examId: a.examId,
    examTitle: a.examTitle,
    date: a.submittedAt,
    percentage: a.result?.percentage ?? 0,
    batchAvg: batchAvgMap.get(a.examId.toString()) ?? a.result?.percentage ?? 0,
  }));

  // 3. Subject Performance Breakdown
  const subjectStats = await Attempt.aggregate([
    {
      $match: {
        studentId: targetObjectId,
        status: "submitted",
      },
    },
    {
      $group: {
        _id: "$subjectId",
        examsTaken: { $sum: 1 },
        avgPct: { $avg: "$result.percentage" },
      },
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subjectDoc",
      },
    },
    { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subjectDoc.name",
        subjectCode: "$subjectDoc.code",
        examsTaken: 1,
        averagePercentage: { $round: ["$avgPct", 1] },
      },
    },
    { $sort: { subjectCode: 1 } },
  ]);

  // 4. Topic Accuracy (Strengths & Weaknesses)
  const topicStats = await Attempt.aggregate([
    {
      $match: {
        studentId: targetObjectId,
        status: "submitted",
      },
    },
    { $unwind: "$result.evaluations" },
    {
      $group: {
        _id: "$result.evaluations.topic",
        totalQuestions: { $sum: 1 },
        correctQuestions: {
          $sum: {
            $cond: [{ $eq: ["$result.evaluations.isCorrect", true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        topic: "$_id",
        totalQuestions: 1,
        correctQuestions: 1,
        accuracy: {
          $round: [
            {
              $multiply: [
                { $divide: ["$correctQuestions", "$totalQuestions"] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
  ]);

  const qualifiedTopics = topicStats.map((t) => ({
    topic: t.topic || "General",
    accuracy: t.accuracy,
    totalQuestions: t.totalQuestions,
    correctQuestions: t.correctQuestions,
    qualified: t.totalQuestions >= 5,
  }));

  const strengths = qualifiedTopics
    .filter((t) => t.qualified && t.accuracy >= 75)
    .sort((a, b) => b.accuracy - a.accuracy);

  const weaknesses = qualifiedTopics
    .filter((t) => t.qualified && t.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy);

  const insufficientData = qualifiedTopics
    .filter((topic) => !topic.qualified)
    .sort((a, b) => b.totalQuestions - a.totalQuestions);

  // 5. Improvement Indicator (last up to 3 vs prior up to 3)
  const improvement = calculateImprovement(attempts);

  // 6. Time Efficiency (Average timeTakenSeconds vs Duration)
  let timeEfficiency = {
    averageTimeTakenSeconds: 0,
    averageDurationSeconds: 0,
    efficiencyPercentage: 0,
  };

  if (attempts.length > 0) {
    const totalTime = attempts.reduce(
      (acc, a) => acc + (a.result?.timeTakenSeconds || 0),
      0,
    );
    const avgTimeTaken = Math.round(totalTime / attempts.length);

    const examDocs = await Exam.find({ _id: { $in: examIds } })
      .select("durationMinutes")
      .lean();
    const durationMap = new Map(
      examDocs.map((e) => [e._id.toString(), e.durationMinutes * 60]),
    );

    const totalDuration = attempts.reduce(
      (acc, a) => acc + (durationMap.get(a.examId.toString()) || 3600),
      0,
    );
    const avgDuration = Math.round(totalDuration / attempts.length);
    const efficiencyPercentage =
      avgDuration > 0 ? round((avgTimeTaken / avgDuration) * 100, 1) : 0;

    timeEfficiency = {
      averageTimeTakenSeconds: avgTimeTaken,
      averageDurationSeconds: avgDuration,
      efficiencyPercentage,
    };
  }

  return {
    overview,
    trend,
    subjects: subjectStats,
    topics: { strengths, weaknesses, insufficientData },
    improvement,
    timeEfficiency,
  };
}

/**
 * 2. Exam Analytics Summary (§14.2, §15.6)
 * Returns participation, score stats (mean, median, highest, lowest, stdDev),
 * pass rate, distribution histogram, avg time, and flagged attempts.
 */
export async function getExamAnalytics({ examId, user }) {
  const exam = await Exam.findById(examId).populate("subjectId", "name code");
  if (!exam) {
    throw new ApiError(404, "NOT_FOUND", "Exam not found");
  }

  if (
    user.role === "teacher" &&
    exam.createdBy.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  // Lazy sweeper to finalize expired attempts before compiling analytics
  await finalizeExpired(exam._id);

  // Eligible students in assigned batches
  const eligibleCount = await User.countDocuments({
    role: "student",
    isActive: true,
    batchId: { $in: exam.batchIds },
  });

  const allAttempts = await Attempt.find({ examId: exam._id })
    .populate("studentId", "name email rollNumber")
    .sort({ "result.score": -1 })
    .lean();

  const attempts = allAttempts.filter(
    (attempt) => attempt.status === "submitted",
  );

  const attemptedCount = allAttempts.length;
  const submittedCount = attempts.length;
  const participationRate =
    eligibleCount > 0 ? round((attemptedCount / eligibleCount) * 100, 1) : 0;

  const percentages = attempts.map((a) => a.result?.percentage ?? 0);

  // Score statistics
  let stats = {
    average: 0,
    median: 0,
    highest: 0,
    lowest: 0,
    standardDeviation: 0,
  };

  let passRate = {
    passedCount: 0,
    failedCount: 0,
    passPercentage: 0,
  };

  if (submittedCount > 0) {
    const avg = round(mean(percentages), 1);
    const med = calculateMedian(percentages);
    const high = Math.max(...percentages);
    const low = Math.min(...percentages);
    const sd = calculateStdDev(percentages);

    stats = {
      average: avg,
      median: med,
      highest: high,
      lowest: low,
      standardDeviation: sd,
    };

    const passedCount = attempts.filter((a) => a.result?.passed).length;
    const failedCount = submittedCount - passedCount;
    const passPct = round((passedCount / submittedCount) * 100, 1);

    passRate = {
      passedCount,
      failedCount,
      passPercentage: passPct,
    };
  }

  // Score distribution in 10 buckets
  const distribution = buildPercentageDistribution(percentages);

  // Average time taken
  const times = attempts.map((a) => a.result?.timeTakenSeconds ?? 0);
  const averageTimeTakenSeconds =
    times.length > 0 ? Math.round(mean(times)) : 0;
  const durationSeconds = exam.durationMinutes * 60;
  const timeRanges = ["0-25%", "25-50%", "50-75%", "75-100%"];
  const timeCounts = Array(4).fill(0);
  for (const time of times) {
    const ratio = durationSeconds > 0 ? (time / durationSeconds) * 100 : 0;
    const bucketIndex = Math.min(3, Math.max(0, Math.floor(ratio / 25)));
    timeCounts[bucketIndex] += 1;
  }
  const timeDistribution = timeRanges.map((range, index) => ({
    range,
    count: timeCounts[index],
  }));

  // Flagged attempts (Academic integrity: tab switches >= 3)
  const flaggedThreshold = 3;
  const flaggedAttempts = allAttempts.filter(
    (a) => (a.tabSwitchCount || 0) >= flaggedThreshold,
  );

  const flagged = {
    count: flaggedAttempts.length,
    threshold: flaggedThreshold,
    attempts: flaggedAttempts.map((a) => ({
      attemptId: a._id,
      student: a.studentId
        ? {
            _id: a.studentId._id,
            name: a.studentId.name,
            email: a.studentId.email,
            rollNumber: a.studentId.rollNumber,
          }
        : null,
      tabSwitchCount: a.tabSwitchCount,
      score: a.result?.score ?? 0,
      percentage: a.result?.percentage ?? 0,
    })),
  };

  return {
    examId: exam._id,
    examTitle: exam.title,
    subject: exam.subjectId
      ? {
          _id: exam.subjectId._id,
          name: exam.subjectId.name,
          code: exam.subjectId.code,
        }
      : null,
    participation: {
      eligibleCount,
      attemptedCount,
      submittedCount,
      participationRate,
    },
    stats,
    passRate,
    distribution,
    avgTime: {
      averageTimeTakenSeconds,
      durationSeconds,
      distribution: timeDistribution,
    },
    flagged,
  };
}

/**
 * 3. Question Analytics per Exam (§14.3, §15.6)
 * Returns difficulty index (correct %), observed vs tagged difficulty,
 * unanswered %, option distribution, and discrimination index.
 */
export async function getExamQuestionAnalytics({ examId, user }) {
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

  const attempts = await Attempt.find({ examId: exam._id, status: "submitted" })
    .sort({ "result.score": -1 })
    .lean();

  const N = attempts.length;

  return exam.questions.map((q) => {
    const evals = attempts
      .map((a) =>
        a.result?.evaluations?.find(
          (e) => e.questionId.toString() === q._id.toString(),
        ),
      )
      .filter(Boolean);

    const correctCount = evals.filter((e) => e.isCorrect).length;
    const unansweredCount = evals.filter(
      (e) => !e.selectedKeys || e.selectedKeys.length === 0,
    ).length;
    const wrongCount = evals.length - correctCount - unansweredCount;

    const correctPct = N > 0 ? round((correctCount / N) * 100, 1) : 0;
    const unansweredPct = N > 0 ? round((unansweredCount / N) * 100, 1) : 0;

    let observedDifficulty = null;
    if (N > 0) {
      observedDifficulty = "hard";
      if (correctPct >= 70) observedDifficulty = "easy";
      else if (correctPct >= 40) observedDifficulty = "medium";
    }

    const difficultyMismatch =
      observedDifficulty !== null && observedDifficulty !== q.difficulty;

    // Option distribution dictionary
    const optionCounts = {};
    (q.options || []).forEach((opt) => {
      optionCounts[opt.key] = 0;
    });
    evals.forEach((e) => {
      (e.selectedKeys || []).forEach((k) => {
        optionCounts[k] = (optionCounts[k] || 0) + 1;
      });
    });

    // Discrimination Index: top 27% correct % minus bottom 27% correct %
    let discriminationIndex = null;
    if (N >= 4) {
      const sliceSize = Math.max(1, Math.round(N * 0.27));
      const topSlice = attempts.slice(0, sliceSize);
      const bottomSlice = attempts.slice(-sliceSize);

      const topCorrect = topSlice.filter((a) => {
        const ev = a.result?.evaluations?.find(
          (e) => e.questionId.toString() === q._id.toString(),
        );
        return ev?.isCorrect;
      }).length;

      const bottomCorrect = bottomSlice.filter((a) => {
        const ev = a.result?.evaluations?.find(
          (e) => e.questionId.toString() === q._id.toString(),
        );
        return ev?.isCorrect;
      }).length;

      discriminationIndex = round(
        topCorrect / sliceSize - bottomCorrect / sliceSize,
        2,
      );
    }

    return {
      questionId: q._id,
      sourceQuestionId: q.sourceQuestionId,
      text: q.text,
      topic: q.topic,
      type: q.type,
      taggedDifficulty: q.difficulty,
      observedDifficulty,
      difficultyMismatch,
      correctPct,
      unansweredPct,
      attemptedCount: evals.length,
      correctCount,
      wrongCount,
      unansweredCount,
      optionCounts,
      discriminationIndex,
    };
  });
}

/**
 * 4. Subject Analytics (§14.4, §15.6)
 * Returns performance over time across exams, batch comparison, and topic accuracy table.
 */
export async function getSubjectAnalytics({ subjectId, batchId = null, user }) {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(404, "NOT_FOUND", "Subject not found");
  }

  if (batchId && !(await Batch.exists({ _id: batchId }))) {
    throw new ApiError(404, "NOT_FOUND", "Batch not found");
  }

  const examFilter = { subjectId: subject._id };
  if (user.role === "teacher") {
    examFilter.createdBy = user._id;
    if (!(await Exam.exists(examFilter))) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden");
    }
  }
  const subjectExamIds = await Exam.distinct("_id", examFilter);
  for (const examId of subjectExamIds) {
    await finalizeExpired(examId);
  }

  const subjectObjectId = new mongoose.Types.ObjectId(subjectId);
  const matchFilter = {
    subjectId: subjectObjectId,
    status: "submitted",
  };

  if (user.role === "teacher") {
    matchFilter.teacherId = user._id;
  }

  if (batchId) {
    matchFilter.batchId = new mongoose.Types.ObjectId(batchId);
  }

  // 1. Performance over time (Exams in this subject)
  const overTimeAgg = await Attempt.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$examId",
        examTitle: { $first: "$examTitle" },
        date: { $min: "$submittedAt" },
        avgPct: { $avg: "$result.percentage" },
        attemptCount: { $sum: 1 },
      },
    },
    { $sort: { date: 1 } },
  ]);

  const overTime = overTimeAgg.map((o) => ({
    examId: o._id,
    examTitle: o.examTitle,
    date: o.date,
    averagePercentage: round(o.avgPct, 1),
    attemptCount: o.attemptCount,
  }));

  // 2. Batch Comparison for this subject
  const comparisonMatch = {
    subjectId: subjectObjectId,
    status: "submitted",
  };
  if (user.role === "teacher") comparisonMatch.teacherId = user._id;

  const batchAgg = await Attempt.aggregate([
    { $match: comparisonMatch },
    {
      $group: {
        _id: "$batchId",
        avgPct: { $avg: "$result.percentage" },
        attemptCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "batches",
        localField: "_id",
        foreignField: "_id",
        as: "batchDoc",
      },
    },
    { $unwind: { path: "$batchDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        batchId: "$_id",
        batchName: "$batchDoc.name",
        averagePercentage: { $round: ["$avgPct", 1] },
        attemptCount: 1,
      },
    },
    { $sort: { batchName: 1 } },
  ]);

  // 3. Topic accuracy table
  const topicAgg = await Attempt.aggregate([
    { $match: matchFilter },
    { $unwind: "$result.evaluations" },
    {
      $group: {
        _id: "$result.evaluations.topic",
        totalEvaluations: { $sum: 1 },
        correctEvaluations: {
          $sum: {
            $cond: [{ $eq: ["$result.evaluations.isCorrect", true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        topic: "$_id",
        totalEvaluations: 1,
        correctEvaluations: 1,
        accuracyPercentage: {
          $round: [
            {
              $multiply: [
                { $divide: ["$correctEvaluations", "$totalEvaluations"] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    { $sort: { accuracyPercentage: -1 } },
  ]);

  return {
    subjectId: subject._id,
    subjectName: subject.name,
    subjectCode: subject.code,
    overTime,
    batchComparison: batchAgg,
    topicTable: topicAgg,
  };
}

/**
 * 5. Teacher Overview Analytics (§14.6, §15.6)
 * Returns active exams, total submissions, pass rate, recent exams,
 * batch comparison, and at-risk students.
 */
export async function getTeacherOverviewAnalytics({ user }) {
  const teacherId = new mongoose.Types.ObjectId(user._id);

  const exams = await Exam.find({ createdBy: teacherId })
    .populate("subjectId", "name code")
    .sort({ createdAt: -1 })
    .lean();

  for (const exam of exams) {
    await finalizeExpired(exam._id);
  }

  const now = new Date();
  const activeExams = exams.filter(
    (e) => e.status === "published" && now >= e.startTime && now <= e.endTime,
  ).length;

  const attempts = await Attempt.find({
    teacherId,
    status: "submitted",
  })
    .populate("studentId", "name email rollNumber batchId")
    .sort({ submittedAt: -1 })
    .lean();

  const totalSubmissions = attempts.length;
  const passRates = exams
    .map((exam) => {
      const examAttempts = attempts.filter(
        (attempt) => attempt.examId.toString() === exam._id.toString(),
      );
      if (!examAttempts.length) return null;
      const passed = examAttempts.filter(
        (attempt) => attempt.result?.passed,
      ).length;
      return (passed / examAttempts.length) * 100;
    })
    .filter((rate) => rate !== null);
  const avgPassRate = passRates.length ? round(mean(passRates), 1) : 0;

  // Recent 5 exams
  const recentExams = exams.slice(0, 5).map((e) => {
    const examAttempts = attempts.filter(
      (a) => a.examId.toString() === e._id.toString(),
    );
    const exPassed = examAttempts.filter((a) => a.result?.passed).length;
    const exPercentages = examAttempts.map((a) => a.result?.percentage ?? 0);

    return {
      _id: e._id,
      title: e.title,
      subjectCode: e.subjectId?.code || "",
      subjectName: e.subjectId?.name || "",
      status: e.status,
      attemptCount: examAttempts.length,
      averageScore:
        exPercentages.length > 0 ? round(mean(exPercentages), 1) : 0,
      passRate:
        examAttempts.length > 0
          ? round((exPassed / examAttempts.length) * 100, 1)
          : 0,
      startTime: e.startTime,
      endTime: e.endTime,
    };
  });

  // Batch comparison across teacher's exams
  const batchAgg = await Attempt.aggregate([
    { $match: { teacherId, status: "submitted" } },
    {
      $group: {
        _id: "$batchId",
        avgPct: { $avg: "$result.percentage" },
        attemptCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "batches",
        localField: "_id",
        foreignField: "_id",
        as: "batchDoc",
      },
    },
    { $unwind: { path: "$batchDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        batchId: "$_id",
        batchName: "$batchDoc.name",
        averagePercentage: { $round: ["$avgPct", 1] },
        attemptCount: 1,
      },
    },
    { $sort: { batchName: 1 } },
  ]);

  // At-risk candidates: mean score over their last up to 2 exams is < 40%
  const studentAttemptsMap = new Map();
  attempts.forEach((a) => {
    if (!a.studentId) return;
    const sId = a.studentId._id.toString();
    if (!studentAttemptsMap.has(sId)) {
      studentAttemptsMap.set(sId, {
        student: a.studentId,
        attempts: [],
      });
    }
    studentAttemptsMap.get(sId).attempts.push(a);
  });

  const atRisk = [];
  const examMap = new Map(exams.map((exam) => [exam._id.toString(), exam]));
  studentAttemptsMap.forEach(({ student, attempts: sAttempts }) => {
    // Already sorted by submittedAt descending
    const last2 = sAttempts.slice(0, 2);
    if (last2.length < 2) return;
    const pcts = last2.map((a) => a.result?.percentage ?? 0);
    const recentAvg = round(mean(pcts), 1);
    const passThreshold = round(
      mean(
        last2.map(
          (attempt) =>
            examMap.get(attempt.examId.toString())?.passPercentage ?? 40,
        ),
      ),
      1,
    );

    if (recentAvg < passThreshold) {
      atRisk.push({
        studentId: student._id,
        studentName: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        recentAverage: recentAvg,
        passThreshold,
        recentExamsCount: last2.length,
      });
    }
  });

  return {
    activeExams,
    totalExams: exams.length,
    totalSubmissions,
    avgPassRate,
    recentExams,
    batchComparison: batchAgg,
    atRisk,
  };
}

/**
 * 6. Admin Overview Platform Analytics (§14.6, §15.6)
 * Returns usersByRole, examsByStatus, attemptsPerDay (last 14 days),
 * and avgBySubject.
 */
export async function getAdminOverviewAnalytics() {
  await finalizeExpired();
  // 1. Users by Role
  const usersAgg = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  const usersByRole = { admin: 0, teacher: 0, student: 0 };
  usersAgg.forEach((u) => {
    if (usersByRole[u._id] !== undefined) {
      usersByRole[u._id] = u.count;
    }
  });

  // 2. Exams by Status
  const examsAgg = await Exam.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const examsByStatus = { draft: 0, published: 0, archived: 0 };
  examsAgg.forEach((e) => {
    if (examsByStatus[e._id] !== undefined) {
      examsByStatus[e._id] = e.count;
    }
  });

  // 3. Attempts Per Day (Last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

  const attemptsAgg = await Attempt.aggregate([
    {
      $match: {
        status: "submitted",
        submittedAt: { $gte: fourteenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const attemptsCountMap = new Map(attemptsAgg.map((a) => [a._id, a.count]));

  // Fill in all 14 chronological calendar dates
  const attemptsPerDay = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    attemptsPerDay.push({
      date: dateStr,
      count: attemptsCountMap.get(dateStr) || 0,
    });
  }

  // 4. Average % by Subject
  const subjectAgg = await Attempt.aggregate([
    { $match: { status: "submitted" } },
    {
      $group: {
        _id: "$subjectId",
        avgPct: { $avg: "$result.percentage" },
        attemptsCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subjectDoc",
      },
    },
    { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        subjectId: "$_id",
        subjectCode: "$subjectDoc.code",
        subjectName: "$subjectDoc.name",
        averagePercentage: { $round: ["$avgPct", 1] },
        attemptsCount: 1,
      },
    },
    { $sort: { subjectCode: 1 } },
  ]);

  return {
    usersByRole,
    examsByStatus,
    attemptsPerDay,
    avgBySubject: subjectAgg,
  };
}
