import * as questionService from "../services/questionService.js";
import { sendSuccess } from "../utils/response.js";

export async function listQuestions(req, res) {
  const result = await questionService.listQuestions({
    user: req.user,
    ...req.query,
  });
  return sendSuccess(res, result.questions, 200, result.meta);
}

export async function createQuestion(req, res) {
  const question = await questionService.createQuestion({
    user: req.user,
    data: req.body,
  });
  return sendSuccess(res, { question }, 201);
}

export async function getQuestionDetail(req, res) {
  const question = await questionService.getQuestionById({
    user: req.user,
    id: req.params.id,
  });
  return sendSuccess(res, { question });
}

export async function updateQuestion(req, res) {
  const question = await questionService.updateQuestion({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  return sendSuccess(res, { question });
}

export async function deleteQuestion(req, res) {
  const result = await questionService.deleteQuestion({
    user: req.user,
    id: req.params.id,
  });
  return sendSuccess(res, result);
}

export async function getTopics(req, res) {
  const topics = await questionService.getDistinctTopics({
    user: req.user,
    subjectId: req.query.subjectId,
  });
  return sendSuccess(res, topics);
}
