import { User, Batch } from "../models/index.js";
import { hashPassword } from "../utils/passwords.js";
import { ApiError } from "../utils/response.js";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function formatUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

export async function listUsers({
  role,
  batchId,
  search,
  isActive,
  page = 1,
  limit = 20,
}) {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (batchId) {
    query.batchId = batchId;
  }

  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { rollNumber: { $regex: escaped, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("batchId", "name year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map(formatUser),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createUser({
  name,
  email,
  password,
  role,
  batchId,
  rollNumber,
}) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  if (role === "student") {
    if (!batchId) {
      throw ApiError.badRequest("Batch is required for students");
    }
    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw ApiError.badRequest("Selected batch does not exist");
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    batchId: role === "student" ? batchId : null,
    rollNumber: rollNumber || null,
    isActive: true,
  });

  const populated = await User.findById(user._id).populate(
    "batchId",
    "name year",
  );
  return formatUser(populated);
}

export async function getUserById(id) {
  const user = await User.findById(id).populate("batchId", "name year");
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return formatUser(user);
}

export async function updateUser(id, updates) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Prevent demoting the last admin
  if (
    user.role === "admin" &&
    user.isActive &&
    updates.role &&
    updates.role !== "admin"
  ) {
    const adminCount = await User.countDocuments({
      role: "admin",
      isActive: true,
    });
    if (adminCount <= 1) {
      throw ApiError.badRequest(
        "Cannot demote the last remaining active administrator",
      );
    }
  }

  const nextRole = updates.role || user.role;
  const nextBatchId =
    updates.batchId !== undefined ? updates.batchId : user.batchId;

  if (nextRole === "student") {
    if (!nextBatchId) {
      throw ApiError.badRequest("Batch is required for students", [
        { path: "batchId", message: "Select a batch for this student" },
      ]);
    }
    const batch = await Batch.findById(nextBatchId);
    if (!batch) {
      throw ApiError.badRequest("Selected batch does not exist");
    }
  }

  if (updates.name) user.name = updates.name;
  user.role = nextRole;
  if (updates.rollNumber !== undefined) user.rollNumber = updates.rollNumber;

  if (user.role === "student") {
    user.batchId = nextBatchId;
  } else {
    user.batchId = null;
    user.rollNumber = null;
  }

  await user.save();
  const populated = await User.findById(user._id).populate(
    "batchId",
    "name year",
  );
  return formatUser(populated);
}

export async function updateUserStatus(id, isActive, currentAdminId) {
  if (id === currentAdminId.toString() && !isActive) {
    throw ApiError.badRequest(
      "Cannot deactivate your own administrator account",
    );
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.role === "admin" && !isActive) {
    const activeAdmins = await User.countDocuments({
      role: "admin",
      isActive: true,
    });
    if (activeAdmins <= 1) {
      throw ApiError.badRequest(
        "Cannot deactivate the last remaining active administrator",
      );
    }
  }

  user.isActive = isActive;
  await user.save();
  return formatUser(user);
}

export async function resetUserPassword(id, newPassword) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { message: "Password reset successfully" };
}
