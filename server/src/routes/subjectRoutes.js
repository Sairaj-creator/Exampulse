import { Router } from "express";
import * as subjectController from "../controllers/subjectController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  subjectSchema,
  updateSubjectSchema,
  idParamSchema,
} from "../validators/adminValidators.js";

const router = Router();

// Public list for questions, exam building, and student viewing
router.get("/", asyncHandler(subjectController.listSubjects));

// Admin-only management routes
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(subjectSchema),
  asyncHandler(subjectController.createSubject),
);

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(idParamSchema, "params"),
  validate(updateSubjectSchema),
  asyncHandler(subjectController.updateSubject),
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(idParamSchema, "params"),
  asyncHandler(subjectController.deleteSubject),
);

export const subjectRoutes = router;
