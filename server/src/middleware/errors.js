import { ApiError } from "../utils/response.js";

export function notFound(req, res, next) {
  next(new ApiError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const isProduction = process.env.NODE_ENV === "production";
  let status = error.status || 500;
  let code = error.code || "INTERNAL";
  let message = error.message || "Service unavailable";
  let details = error.details || null;

  if (error.type === "entity.parse.failed") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid JSON";
  } else if (error.code === 11000) {
    status = 409;
    code = "CONFLICT";
    const field =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "record";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else if (error.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = Object.values(error.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (error.name === "CastError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = `Invalid ID format for ${error.path}`;
  } else if (error.name === "ZodError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Validation error";
    details = error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
  }

  if (status >= 500 && isProduction) {
    message = "Internal server error";
  }

  const errorPayload = {
    code,
    message,
  };

  if (
    details !== null &&
    details !== undefined &&
    (!Array.isArray(details) || details.length > 0)
  ) {
    errorPayload.details = details;
  }

  return res.status(status).json({
    success: false,
    error: errorPayload,
  });
}
