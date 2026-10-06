/**
 * Pure grading service for ExamPulse attempts.
 * Evaluates student answers against immutable exam question snapshots.
 */
export function gradeAttempt({
  examQuestions = [],
  answers = [],
  rules = {},
  startedAt,
  submittedAt = new Date(),
  expiresAt,
}) {
  const {
    negativeMarking = { enabled: false, penaltyFraction: 0.25 },
    passPercentage = 40,
    totalMarks: configuredTotalMarks,
  } = rules;

  // Build answer lookup map by questionId
  const answerMap = new Map();
  for (const ans of answers) {
    const qIdStr = ans.questionId?._id
      ? ans.questionId._id.toString()
      : ans.questionId?.toString();
    if (qIdStr) {
      answerMap.set(qIdStr, ans);
    }
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let totalScore = 0;
  let computedTotalMarks = 0;

  const evaluations = [];

  for (const q of examQuestions) {
    const qIdStr = q._id?.toString();
    const qMarks = Number(q.marks) || 1;
    computedTotalMarks += qMarks;

    const answer = answerMap.get(qIdStr);
    const selectedKeys = Array.isArray(answer?.selectedKeys)
      ? [...answer.selectedKeys].sort()
      : [];
    const correctKeys = Array.isArray(q.correctKeys)
      ? [...q.correctKeys].sort()
      : [];

    let isCorrect = false;
    let marksAwarded = 0;

    if (selectedKeys.length === 0) {
      // Unanswered: never penalized
      unansweredCount++;
      isCorrect = false;
      marksAwarded = 0;
    } else {
      // Answered: compare sets
      const isMatch =
        selectedKeys.length === correctKeys.length &&
        selectedKeys.every((key, idx) => key === correctKeys[idx]);

      if (isMatch) {
        isCorrect = true;
        correctCount++;
        marksAwarded = qMarks;
      } else {
        isCorrect = false;
        wrongCount++;
        if (negativeMarking?.enabled) {
          const penaltyFraction = Number(
            negativeMarking.penaltyFraction ?? 0.25,
          );
          const penalty = qMarks * penaltyFraction;
          marksAwarded = penalty === 0 ? 0 : -penalty;
        } else {
          marksAwarded = 0;
        }
      }
    }

    totalScore += marksAwarded;

    evaluations.push({
      questionId: q._id,
      sourceQuestionId: q.sourceQuestionId || q._id,
      topic: q.topic || "",
      difficulty: q.difficulty || "medium",
      selectedKeys,
      correctKeys,
      isCorrect,
      marksAwarded: Math.round(marksAwarded * 100) / 100,
    });
  }

  // Final score cannot fall below 0 (floor at 0 per §13.1)
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const examTotalMarks = configuredTotalMarks || computedTotalMarks || 1;
  const percentage =
    examTotalMarks > 0
      ? Math.round((finalScore / examTotalMarks) * 10000) / 100
      : 0;
  const passed = percentage >= passPercentage;

  // Compute time taken in seconds: min(submittedAt, expiresAt) - startedAt
  const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
  const submitMs = new Date(submittedAt).getTime();
  const expireMs = expiresAt ? new Date(expiresAt).getTime() : submitMs;
  const endEffectiveMs = Math.min(submitMs, expireMs);
  const timeTakenSeconds = Math.max(
    0,
    Math.round((endEffectiveMs - startMs) / 1000),
  );

  return {
    score: finalScore,
    totalMarks: examTotalMarks,
    percentage,
    passed,
    correctCount,
    wrongCount,
    unansweredCount,
    timeTakenSeconds,
    evaluations,
  };
}
