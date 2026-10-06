import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as studentExamController from "../controllers/studentExamController.js";
import { examIdParamSchema } from "../validators/examValidators.js";
import { listStudentExamsQuerySchema } from "../validators/attemptValidators.js";

const router = Router();

router.use(authenticate, requireRole("student"));

router.get(
  "/",
  validate(listStudentExamsQuerySchema, "query"),
  asyncHandler(studentExamController.listAssignedExams),
);
router.get(
  "/:id",
  validate(examIdParamSchema, "params"),
  asyncHandler(studentExamController.getExamInstructions),
);

export const studentExamRoutes = router;
