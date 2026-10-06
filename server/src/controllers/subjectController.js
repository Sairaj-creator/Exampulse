import * as subjectService from "../services/subjectService.js";
import { sendSuccess } from "../utils/response.js";

export async function listSubjects(req, res) {
  return sendSuccess(res, await subjectService.listSubjects());
}

export async function createSubject(req, res) {
  return sendSuccess(
    res,
    { subject: await subjectService.createSubject(req.body) },
    201,
  );
}

export async function updateSubject(req, res) {
  return sendSuccess(res, {
    subject: await subjectService.updateSubject(req.params.id, req.body),
  });
}

export async function deleteSubject(req, res) {
  return sendSuccess(res, await subjectService.deleteSubject(req.params.id));
}
