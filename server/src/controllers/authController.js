import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../services/authService.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/tokens.js";
import { sendSuccess } from "../utils/response.js";

export async function register(req, res) {
  const user = await registerUser(req.body);
  const token = signToken(user);
  setAuthCookie(res, token);
  return sendSuccess(res, { user }, 201);
}

export async function login(req, res) {
  const user = await loginUser(req.body);
  const token = signToken(user);
  setAuthCookie(res, token);
  return sendSuccess(res, { user });
}

export async function logout(req, res) {
  clearAuthCookie(res);
  return sendSuccess(res, {});
}

export async function getMe(req, res) {
  const user = await getCurrentUser(req.user._id);
  return sendSuccess(res, { user });
}

export async function updateMe(req, res) {
  const user = await updateProfile(req.user._id, req.body);
  return sendSuccess(res, { user });
}

export async function updatePassword(req, res) {
  const result = await changePassword(req.user._id, req.body);
  return sendSuccess(res, result);
}
