import { api } from "../../lib/api";

export async function loginApi(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data.data.user;
}

export async function registerApi(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data.data.user;
}

export async function logoutApi() {
  const response = await api.post("/auth/logout");
  return response.data.data;
}

export async function getMeApi() {
  const response = await api.get("/auth/me");
  return response.data.data.user;
}

export async function updateMeApi(payload) {
  const response = await api.patch("/auth/me", payload);
  return response.data.data.user;
}

export async function updatePasswordApi(payload) {
  const response = await api.patch("/auth/me/password", payload);
  return response.data.data;
}

export async function getBatchesApi() {
  const response = await api.get("/batches");
  return response.data.data;
}
