import { Router } from "express";
import { z } from "zod";
import * as questionController from "../controllers/questionController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listQuestionsQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  getTopicsQuerySchema,
} from "../validators/questionValidators.js";

const router = Router();

const idParamSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID"),
  })
  .strict();

router.use(authenticate, requireRole("teacher", "admin"));

router.get(
  "/",
  validate(listQuestionsQuerySchema, "query"),
  asyncHandler(questionController.listQuestions),
);

router.post(
  "/",
  validate(createQuestionSchema),
  asyncHandler(questionController.createQuestion),
);

router.get(
  "/topics",
  validate(getTopicsQuerySchema, "query"),
  asyncHandler(questionController.getTopics),
);

router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(questionController.getQuestionDetail),
);

router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateQuestionSchema),
  asyncHandler(questionController.updateQuestion),
);

router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(questionController.deleteQuestion),
);

export const questionRoutes = router;
