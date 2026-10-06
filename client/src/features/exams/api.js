import { api } from "../../lib/api";

export async function listExamsApi(params = {}) {
  const response = await api.get("/exams", { params });
  return { exams: response.data.data, meta: response.data.meta };
}

export async function getExamApi(id) {
  return (await api.get(`/exams/${id}`)).data.data.exam;
}

export async function createExamApi(payload) {
  return (await api.post("/exams", payload)).data.data.exam;
}

export async function updateExamApi(id, payload) {
  return (await api.patch(`/exams/${id}`, payload)).data.data.exam;
}

export async function deleteExamApi(id) {
  return (await api.delete(`/exams/${id}`)).data.data;
}

export async function addExamQuestionsApi(id, questionIds) {
  return (await api.post(`/exams/${id}/questions`, { questionIds })).data.data
    .exam;
}

export async function updateExamQuestionApi(id, questionId, marks) {
  return (await api.patch(`/exams/${id}/questions/${questionId}`, { marks }))
    .data.data.exam;
}

export async function removeExamQuestionApi(id, questionId) {
  return (await api.delete(`/exams/${id}/questions/${questionId}`)).data.data
    .exam;
}

export async function reorderExamQuestionsApi(id, orderedIds) {
  return (await api.put(`/exams/${id}/questions/order`, { orderedIds })).data
    .data.exam;
}

export async function publishExamApi(id) {
  return (await api.post(`/exams/${id}/publish`)).data.data.exam;
}

export async function unpublishExamApi(id) {
  return (await api.post(`/exams/${id}/unpublish`)).data.data.exam;
}

export async function archiveExamApi(id) {
  return (await api.post(`/exams/${id}/archive`)).data.data.exam;
}

export async function duplicateExamApi(id, title) {
  return (await api.post(`/exams/${id}/duplicate`, title ? { title } : {})).data
    .data.exam;
}
