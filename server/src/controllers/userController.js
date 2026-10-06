import * as userService from "../services/userService.js";
import { sendSuccess } from "../utils/response.js";

export async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  return sendSuccess(res, result.users, 200, result.meta);
}

export async function createUser(req, res) {
  const user = await userService.createUser(req.body);
  return sendSuccess(res, { user }, 201);
}

export async function getUserDetail(req, res) {
  const user = await userService.getUserById(req.params.id);
  return sendSuccess(res, { user });
}

export async function updateUser(req, res) {
  const user = await userService.updateUser(req.params.id, req.body);
  return sendSuccess(res, { user });
}

export async function updateUserStatus(req, res) {
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.isActive,
    req.user._id,
  );
  return sendSuccess(res, { user });
}

export async function resetPassword(req, res) {
  const result = await userService.resetUserPassword(
    req.params.id,
    req.body.newPassword,
  );
  return sendSuccess(res, result);
}
