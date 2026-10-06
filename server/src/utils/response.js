export function sendSuccess(res, data, status = 200, meta) {
  const payload = { success: true, data };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(status).json(payload);
}

export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details = null) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHENTICATED", message);
  }

  static forbidden(message = "Access forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message, code = "CONFLICT") {
    return new ApiError(409, code, message);
  }

  static expired(message = "Attempt has expired") {
    return new ApiError(410, "ATTEMPT_EXPIRED", message);
  }

  static tooManyRequests(
    message = "Too many requests, please try again later",
  ) {
    return new ApiError(429, "RATE_LIMITED", message);
  }
}
