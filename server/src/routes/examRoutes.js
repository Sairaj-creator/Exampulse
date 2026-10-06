import { Router } from "express";
import * as examController from "../controllers/examController.js";
import * as attemptController from "../controllers/attemptController.js";
import * as resultController from "../controllers/resultController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addExamQuestionsSchema,
  createExamSchema,
  duplicateExamSchema,
  examIdParamSchema,
  examQuestionParamSchema,
  listExamsQuerySchema,
  reorderExamQuestionsSchema,
  updateExamQuestionSchema,
  updateExamSchema,
} from "../validators/examValidators.js";
import {
  examAttemptParamSchema,
  resetAttemptParamSchema,
} from "../validators/attemptValidators.js";
import {
  examLeaderboardParamSchema,
  leaderboardQuerySchema,
} from "../validators/resultValidators.js";

const router = Router();

// Student start/resume attempt route
router.post(
  "/:id/attempts",
  authenticate,
  requireRole("student"),
  validate(examAttemptParamSchema, "params"),
  asyncHandler(attemptController.startOrResume),
);

// Leaderboard route for all authenticated users
router.get(
  "/:id/leaderboard",
  authenticate,
  validate(examLeaderboardParamSchema, "params"),
  validate(leaderboardQuerySchema, "query"),
  asyncHandler(resultController.getExamLeaderboard),
);

// Teacher and Admin protected routes
router.use(authenticate, requireRole("teacher", "admin"));

router.get(
  "/",
  validate(listExamsQuerySchema, "query"),
  asyncHandler(examController.listExams),
);
router.post(
  "/",
  validate(createExamSchema),
  asyncHandler(examController.createExam),
);
router.get(
  "/:id",
  validate(examIdParamSchema, "params"),
  asyncHandler(examController.getExam),
);
router.patch(
  "/:id",
  validate(examIdParamSchema, "params"),
  validate(updateExamSchema),
  asyncHandler(examController.updateExam),
);
router.delete(
  "/:id",
  validate(examIdParamSchema, "params"),
  asyncHandler(examController.deleteExam),
);
router.post(
  "/:id/questions",
  validate(examIdParamSchema, "params"),
  validate(addExamQuestionsSchema),
  asyncHandler(examController.addQuestions),
);
router.patch(
  "/:id/questions/:questionId",
  validate(examQuestionParamSchema, "params"),
  validate(updateExamQuestionSchema),
  asyncHandler(examController.updateQuestionMarks),
);
router.delete(
  "/:id/questions/:questionId",
  validate(examQuestionParamSchema, "params"),
  asyncHandler(examController.removeQuestion),
);
router.put(
  "/:id/questions/order",
  validate(examIdParamSchema, "params"),
  validate(reorderExamQuestionsSchema),
  asyncHandler(examController.reorderQuestions),
);
router.post(
  "/:id/publish",
  validate(examIdParamSchema, "params"),
  asyncHandler(examController.publishExam),
);
router.post(
  "/:id/unpublish",
  validate(examIdParamSchema, "params"),
  asyncHandler(examController.unpublishExam),
);
router.post(
  "/:id/archive",
  validate(examIdParamSchema, "params"),
  asyncHandler(examController.archiveExam),
);
router.post(
  "/:id/duplicate",
  validate(examIdParamSchema, "params"),
  validate(duplicateExamSchema),
  asyncHandler(examController.duplicateExam),
);
router.get(
  "/:id/attempts",
  validate(examIdParamSchema, "params"),
  asyncHandler(attemptController.getExamSubmissions),
);
router.delete(
  "/:id/attempts/:attemptId",
  requireRole("teacher"),
  validate(resetAttemptParamSchema, "params"),
  asyncHandler(attemptController.resetAttempt),
);
router.get(
  "/:id/export",
  validate(examIdParamSchema, "params"),
  asyncHandler(resultController.exportExamCsv),
);

export const examRoutes = router;
