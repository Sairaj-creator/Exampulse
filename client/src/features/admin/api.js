import { api } from "../../lib/api";

export async function listUsersApi(params) {
  const response = await api.get("/users", { params });
  return { users: response.data.data, meta: response.data.meta };
}
export async function createUserApi(payload) {
  return (await api.post("/users", payload)).data.data.user;
}
export async function updateUserApi(id, payload) {
  return (await api.patch(`/users/${id}`, payload)).data.data.user;
}
export async function updateUserStatusApi(id, isActive) {
  return (await api.patch(`/users/${id}/status`, { isActive })).data.data.user;
}
export async function resetUserPasswordApi(id, newPassword) {
  return (await api.post(`/users/${id}/reset-password`, { newPassword })).data
    .data;
}

export async function listBatchesApi() {
  return (await api.get("/batches")).data.data;
}
export async function createBatchApi(payload) {
  return (await api.post("/batches", payload)).data.data.batch;
}
export async function updateBatchApi(id, payload) {
  return (await api.patch(`/batches/${id}`, payload)).data.data.batch;
}
export async function deleteBatchApi(id) {
  return (await api.delete(`/batches/${id}`)).data.data;
}

export async function listSubjectsApi() {
  return (await api.get("/subjects")).data.data;
}
export async function createSubjectApi(payload) {
  return (await api.post("/subjects", payload)).data.data.subject;
}
export async function updateSubjectApi(id, payload) {
  return (await api.patch(`/subjects/${id}`, payload)).data.data.subject;
}
export async function deleteSubjectApi(id) {
  return (await api.delete(`/subjects/${id}`)).data.data;
}
