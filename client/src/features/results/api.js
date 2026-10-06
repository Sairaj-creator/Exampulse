import { api } from "../../lib/api";

export async function getAttemptResultApi(attemptId) {
  const response = await api.get(`/attempts/${attemptId}/result`);
  return response.data.data;
}

export async function getMyAttemptsApi() {
  const response = await api.get("/attempts/mine");
  return response.data.data;
}

export async function getExamLeaderboardApi(examId, params = {}) {
  const response = await api.get(`/exams/${examId}/leaderboard`, { params });
  return response.data.data;
}

export async function getExamSubmissionsApi(examId) {
  const response = await api.get(`/exams/${examId}/attempts`);
  return response.data.data;
}

export async function resetAttemptApi(examId, attemptId) {
  const response = await api.delete(`/exams/${examId}/attempts/${attemptId}`);
  return response.data.data;
}

export async function exportExamCsvApi(examId) {
  const response = await api.get(`/exams/${examId}/export`, {
    responseType: "blob",
  });
  return response.data;
}
