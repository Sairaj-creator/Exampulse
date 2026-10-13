import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { verifyToken, COOKIE_NAME } from "../utils/tokens.js";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// An exam hall usually shares one public IP, so signed-in traffic is counted
// per account. Only anonymous traffic falls back to the per-IP budget.
export const ANONYMOUS_LIMIT = 300;
export const AUTHENTICATED_LIMIT = 2000;
export const LOGIN_FAILURE_LIMIT = 10;
export const LOGIN_IP_FAILURE_LIMIT = 100;

const skipInTests = () => process.env.NODE_ENV === "test";

function rateLimited(message) {
  return { success: false, error: { code: "RATE_LIMITED", message } };
}

/**
 * Returns the user id from a correctly signed session token, or null. The
 * signature is checked so a forged cookie cannot mint itself a fresh bucket.
 */
function sessionUserId(req) {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return null;
  try {
    return verifyToken(token).sub || null;
  } catch {
    return null;
  }
}

export function createGeneralLimiter({ skip = skipInTests } = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: (req) =>
      sessionUserId(req) ? AUTHENTICATED_LIMIT : ANONYMOUS_LIMIT,
    keyGenerator: (req) => {
      const userId = sessionUserId(req);
      return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip)}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimited("Too many requests. Please try again later."),
    skip,
  });
}

/**
 * Brute-force guard for one account: failed logins are counted per
 * IP + email, so classmates signing in from the same network do not lock
 * each other out.
 */
export function createLoginLimiter({ skip = skipInTests } = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: LOGIN_FAILURE_LIMIT,
    keyGenerator: (req) => {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
      return `login:${ipKeyGenerator(req.ip)}:${email}`;
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimited(
      "Too many login attempts. Please try again after 15 minutes.",
    ),
    skip,
  });
}

/**
 * Credential-stuffing guard: caps failed logins from one IP across all emails.
 */
export function createLoginIpLimiter({ skip = skipInTests } = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: LOGIN_IP_FAILURE_LIMIT,
    keyGenerator: (req) => `login-ip:${ipKeyGenerator(req.ip)}`,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimited(
      "Too many login attempts from this network. Please try again later.",
    ),
    skip,
  });
}

export const generalLimiter = createGeneralLimiter();
export const loginLimiter = createLoginLimiter();
export const loginIpLimiter = createLoginIpLimiter();
