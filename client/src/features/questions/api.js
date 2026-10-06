import { api } from "../../lib/api";

export async function getQuestionsApi(params = {}) {
  const response = await api.get("/questions", { params });
  return {
    questions: response.data.data,
    meta: response.data.meta,
  };
}

export async function getQuestionDetailApi(id) {
  const response = await api.get(`/questions/${id}`);
  return response.data.data.question;
}

export async function createQuestionApi(payload) {
  const response = await api.post("/questions", payload);
  return response.data.data.question;
}

export async function updateQuestionApi(id, payload) {
  const response = await api.patch(`/questions/${id}`, payload);
  return response.data.data.question;
}

export async function deleteQuestionApi(id) {
  const response = await api.delete(`/questions/${id}`);
  return response.data.data;
}

export async function getTopicsApi(subjectId) {
  const response = await api.get("/questions/topics", {
    params: subjectId ? { subjectId } : {},
  });
  return response.data.data;
}

export async function getSubjectsApi() {
  const response = await api.get("/subjects");
  return response.data.data;
}
