import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Normalises an axios failure into the API's `{ code, message, details }`
 * shape. For validation failures the field-level messages replace the
 * generic "Validation error", so forms can show what actually went wrong.
 */
export function toApiError(error) {
  const apiError = error.response?.data?.error
    ? { ...error.response.data.error }
    : {
        code: error.code || "NETWORK_ERROR",
        message: error.message || "Something went wrong",
      };

  if (
    apiError.code === "VALIDATION_ERROR" &&
    Array.isArray(apiError.details) &&
    apiError.details.length > 0
  ) {
    const messages = apiError.details
      .map((detail) =>
        detail?.message === "Required" && detail.path
          ? `${detail.path} is required.`
          : detail?.message,
      )
      .filter(Boolean);
    if (messages.length > 0) {
      apiError.message = [...new Set(messages)].join(" ");
    }
  }

  return apiError;
}

// Endpoints where a 401 is an expected answer, not an expired session.
const AUTH_PROBE_PATHS = ["/auth/login", "/auth/me", "/auth/register"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      !AUTH_PROBE_PATHS.some((path) => url.includes(path))
    ) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    return Promise.reject(toApiError(error));
  },
);

export async function getHealth() {
  const response = await api.get("/health");
  return response.data.data;
}
