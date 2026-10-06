import * as attemptService from "../services/attemptService.js";
import { sendSuccess } from "../utils/response.js";

export async function startOrResume(req, res) {
  const result = await attemptService.startOrResumeAttempt({
    examId: req.params.id,
    user: req.user,
  });
  const statusCode = result.resumed ? 200 : 201;
  return sendSuccess(res, result, statusCode);
}

export async function getAttempt(req, res) {
  const state = await attemptService.getAttemptState({
    attemptId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, state);
}

export async function saveAnswer(req, res) {
  const result = await attemptService.saveAnswer({
    attemptId: req.params.id,
    questionId: req.params.questionId,
    selectedKeys: req.body.selectedKeys,
    markedForReview: req.body.markedForReview,
    user: req.user,
  });
  return sendSuccess(res, result);
}

export async function recordEvent(req, res) {
  const result = await attemptService.recordEvent({
    attemptId: req.params.id,
    type: req.body.type,
    user: req.user,
  });
  return sendSuccess(res, result);
}

export async function submitAttempt(req, res) {
  const attempt = await attemptService.submitAttempt({
    attemptId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, {
    attemptId: attempt._id,
    status: attempt.status,
    result: attempt.result,
  });
}

export async function getExamSubmissions(req, res) {
  const submissions = await attemptService.getExamSubmissions({
    examId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, submissions);
}

export async function resetAttempt(req, res) {
  const result = await attemptService.resetAttempt({
    examId: req.params.id,
    attemptId: req.params.attemptId,
    user: req.user,
  });
  return sendSuccess(res, result);
}
