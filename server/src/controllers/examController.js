import * as examService from "../services/examService.js";
import { sendSuccess } from "../utils/response.js";

export async function listExams(req, res) {
  const result = await examService.listExams({ user: req.user, ...req.query });
  return sendSuccess(res, result.exams, 200, result.meta);
}

export async function createExam(req, res) {
  const exam = await examService.createExam({ user: req.user, data: req.body });
  return sendSuccess(res, { exam }, 201);
}

export async function getExam(req, res) {
  const exam = await examService.getExam({ user: req.user, id: req.params.id });
  return sendSuccess(res, { exam });
}

export async function updateExam(req, res) {
  const exam = await examService.updateExam({
    user: req.user,
    id: req.params.id,
    data: req.body,
  });
  return sendSuccess(res, { exam });
}

export async function deleteExam(req, res) {
  return sendSuccess(
    res,
    await examService.deleteExam({ user: req.user, id: req.params.id }),
  );
}

export async function addQuestions(req, res) {
  const exam = await examService.addQuestions({
    user: req.user,
    id: req.params.id,
    questionIds: req.body.questionIds,
  });
  return sendSuccess(res, { exam });
}

export async function updateQuestionMarks(req, res) {
  const exam = await examService.updateQuestionMarks({
    user: req.user,
    id: req.params.id,
    questionId: req.params.questionId,
    marks: req.body.marks,
  });
  return sendSuccess(res, { exam });
}

export async function removeQuestion(req, res) {
  const exam = await examService.removeQuestion({
    user: req.user,
    id: req.params.id,
    questionId: req.params.questionId,
  });
  return sendSuccess(res, { exam });
}

export async function reorderQuestions(req, res) {
  const exam = await examService.reorderQuestions({
    user: req.user,
    id: req.params.id,
    orderedIds: req.body.orderedIds,
  });
  return sendSuccess(res, { exam });
}

export async function publishExam(req, res) {
  const exam = await examService.publishExam({
    user: req.user,
    id: req.params.id,
  });
  return sendSuccess(res, { exam });
}

export async function unpublishExam(req, res) {
  const exam = await examService.unpublishExam({
    user: req.user,
    id: req.params.id,
  });
  return sendSuccess(res, { exam });
}

export async function archiveExam(req, res) {
  const exam = await examService.archiveExam({
    user: req.user,
    id: req.params.id,
  });
  return sendSuccess(res, { exam });
}

export async function duplicateExam(req, res) {
  const exam = await examService.duplicateExam({
    user: req.user,
    id: req.params.id,
    title: req.body.title,
  });
  return sendSuccess(res, { exam }, 201);
}
