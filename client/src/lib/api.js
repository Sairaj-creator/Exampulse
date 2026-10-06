import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorResponse = error.response?.data?.error || {
      code: error.code || "NETWORK_ERROR",
      message: error.message || "Something went wrong",
    };

    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      !error.config?.url?.includes("/auth/me")
    ) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    return Promise.reject(errorResponse);
  },
);

export async function getHealth() {
  const response = await api.get("/health");
  return response.data.data;
}
