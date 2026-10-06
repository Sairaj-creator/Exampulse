import * as analyticsService from "../services/analyticsService.js";
import { sendSuccess } from "../utils/response.js";

export async function getStudentAnalytics(req, res) {
  const data = await analyticsService.getStudentAnalytics({
    studentId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, data);
}

export async function getExamAnalytics(req, res) {
  const data = await analyticsService.getExamAnalytics({
    examId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, data);
}

export async function getExamQuestionAnalytics(req, res) {
  const data = await analyticsService.getExamQuestionAnalytics({
    examId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, data);
}

export async function getSubjectAnalytics(req, res) {
  const data = await analyticsService.getSubjectAnalytics({
    subjectId: req.params.id,
    batchId: req.query.batchId,
    user: req.user,
  });
  return sendSuccess(res, data);
}

export async function getTeacherOverview(req, res) {
  const data = await analyticsService.getTeacherOverviewAnalytics({
    user: req.user,
  });
  return sendSuccess(res, data);
}

export async function getAdminOverview(req, res) {
  const data = await analyticsService.getAdminOverviewAnalytics();
  return sendSuccess(res, data);
}
