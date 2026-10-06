import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post("/logout", authenticate, asyncHandler(authController.logout));

router.get("/me", authenticate, asyncHandler(authController.getMe));

router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateMe),
);

router.patch(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.updatePassword),
);

export const authRoutes = router;
