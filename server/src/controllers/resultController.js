import * as resultService from "../services/resultService.js";
import * as leaderboardService from "../services/leaderboardService.js";
import { sendSuccess } from "../utils/response.js";

export async function getAttemptResult(req, res) {
  const result = await resultService.getAttemptResult({
    attemptId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, result);
}

export async function getMyAttempts(req, res) {
  const attempts = await resultService.getMySubmittedAttempts({
    user: req.user,
  });
  return sendSuccess(res, attempts);
}

export async function getExamLeaderboard(req, res) {
  const leaderboard = await leaderboardService.getExamLeaderboard({
    examId: req.params.id,
    user: req.user,
    limit: req.query.limit,
  });
  return sendSuccess(res, leaderboard);
}

export async function exportExamCsv(req, res) {
  const { filename, content } = await resultService.exportExamResultsCsv({
    examId: req.params.id,
    user: req.user,
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(content);
}
