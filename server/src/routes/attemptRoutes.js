import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as attemptController from "../controllers/attemptController.js";
import * as resultController from "../controllers/resultController.js";
import {
  attemptIdParamSchema,
  saveAnswerParamSchema,
  saveAnswerBodySchema,
  recordEventParamSchema,
  recordEventBodySchema,
} from "../validators/attemptValidators.js";
import { attemptResultParamSchema } from "../validators/resultValidators.js";

const router = Router();

router.use(authenticate);

router.get(
  "/mine",
  requireRole("student"),
  asyncHandler(resultController.getMyAttempts),
);

router.get(
  "/:id/result",
  validate(attemptResultParamSchema, "params"),
  asyncHandler(resultController.getAttemptResult),
);

router.get(
  "/:id",
  requireRole("student"),
  validate(attemptIdParamSchema, "params"),
  asyncHandler(attemptController.getAttempt),
);

router.put(
  "/:id/answers/:questionId",
  requireRole("student"),
  validate(saveAnswerParamSchema, "params"),
  validate(saveAnswerBodySchema),
  asyncHandler(attemptController.saveAnswer),
);

router.post(
  "/:id/events",
  requireRole("student"),
  validate(recordEventParamSchema, "params"),
  validate(recordEventBodySchema),
  asyncHandler(attemptController.recordEvent),
);

router.post(
  "/:id/submit",
  requireRole("student"),
  validate(attemptIdParamSchema, "params"),
  asyncHandler(attemptController.submitAttempt),
);

export const attemptRoutes = router;
