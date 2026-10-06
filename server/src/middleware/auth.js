import { verifyToken, COOKIE_NAME } from "../utils/tokens.js";
import { ApiError } from "../utils/response.js";
import { User } from "../models/User.js";

export async function authenticate(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw ApiError.unauthorized("Authentication required");
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Session invalid or expired");
    }

    const user = await User.findById(payload.sub).populate(
      "batchId",
      "name year",
    );
    if (!user) {
      throw ApiError.unauthorized("Account not found");
    }

    if (!user.isActive) {
      throw ApiError.unauthorized("Account is deactivated");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access restricted to: ${roles.join(", ")}`),
      );
    }

    next();
  };
}
