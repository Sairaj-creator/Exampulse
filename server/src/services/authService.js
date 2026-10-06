import { User, Batch } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/passwords.js";
import { ApiError } from "../utils/response.js";

function formatUser(user) {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
}

export async function registerUser({ name, email, password, batchId }) {
  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw ApiError.badRequest("Selected batch does not exist", [
      { path: "batchId", message: "Batch not found" },
    ]);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "student", // Security contract: forced to student on public register
    batchId: batch._id,
    isActive: true,
  });

  const populated = await User.findById(user._id).populate(
    "batchId",
    "name year",
  );
  return formatUser(populated);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .populate("batchId", "name year");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized(
      "Account has been deactivated. Please contact an administrator.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  return formatUser(user);
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).populate("batchId", "name year");
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return formatUser(user);
}

export async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true, runValidators: true },
  ).populate("batchId", "name year");

  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return formatUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw ApiError.badRequest("Current password does not match");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { message: "Password updated successfully" };
}
