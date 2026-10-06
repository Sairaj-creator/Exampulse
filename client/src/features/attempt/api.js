import { api } from "../../lib/api";

export async function listStudentExamsApi(params = {}) {
  const response = await api.get("/student/exams", { params });
  return response.data.data;
}

export async function getStudentExamInstructionsApi(examId) {
  const response = await api.get(`/student/exams/${examId}`);
  return response.data.data;
}

export async function startOrResumeAttemptApi(examId) {
  const response = await api.post(`/exams/${examId}/attempts`);
  return response.data.data;
}

export async function getAttemptStateApi(attemptId) {
  const response = await api.get(`/attempts/${attemptId}`);
  return response.data.data;
}

export async function saveAnswerApi(attemptId, questionId, payload) {
  const response = await api.put(
    `/attempts/${attemptId}/answers/${questionId}`,
    payload,
  );
  return response.data.data;
}

export async function recordAttemptEventApi(attemptId, type = "tab_hidden") {
  const response = await api.post(`/attempts/${attemptId}/events`, { type });
  return response.data.data;
}

export async function submitAttemptApi(attemptId) {
  const response = await api.post(`/attempts/${attemptId}/submit`);
  return response.data.data;
}
