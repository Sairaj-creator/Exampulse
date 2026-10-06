import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  adminResetPasswordSchema,
  idParamSchema,
} from "../validators/adminValidators.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get(
  "/",
  validate(listUsersQuerySchema, "query"),
  asyncHandler(userController.listUsers),
);

router.post(
  "/",
  validate(createUserSchema),
  asyncHandler(userController.createUser),
);

router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(userController.getUserDetail),
);

router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser),
);

router.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(updateUserStatusSchema),
  asyncHandler(userController.updateUserStatus),
);

router.post(
  "/:id/reset-password",
  validate(idParamSchema, "params"),
  validate(adminResetPasswordSchema),
  asyncHandler(userController.resetPassword),
);

export const userRoutes = router;
