import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env.js";

const COOKIE_NAME = "ep_session";

export function signToken(user) {
  const env = loadEnv();
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN || "8h",
    },
  );
}

export function verifyToken(token) {
  const env = loadEnv();
  return jwt.verify(token, env.JWT_SECRET);
}

export function setAuthCookie(res, token) {
  const env = loadEnv();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  const env = loadEnv();
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });
}

export { COOKIE_NAME };
