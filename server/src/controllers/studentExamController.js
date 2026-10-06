import * as studentExamsService from "../services/studentExamsService.js";
import { sendSuccess } from "../utils/response.js";

export async function listAssignedExams(req, res) {
  const exams = await studentExamsService.listStudentExams({
    user: req.user,
    phase: req.query.phase,
  });
  return sendSuccess(res, exams);
}

export async function getExamInstructions(req, res) {
  const instructions = await studentExamsService.getStudentExamInstructions({
    examId: req.params.id,
    user: req.user,
  });
  return sendSuccess(res, instructions);
}
