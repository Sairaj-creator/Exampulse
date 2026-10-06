import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as analyticsController from "../controllers/analyticsController.js";
import {
  studentAnalyticsParamSchema,
  examAnalyticsParamSchema,
  subjectAnalyticsParamSchema,
  subjectAnalyticsQuerySchema,
} from "../validators/analyticsValidators.js";

export const analyticsRoutes = Router();

// Apply auth to all analytics routes
analyticsRoutes.use(authenticate);

// Teacher Overview KPIs (§15.6)
analyticsRoutes.get(
  "/teacher/overview",
  requireRole("teacher"),
  asyncHandler(analyticsController.getTeacherOverview),
);

// Admin Platform Overview KPIs (§15.6)
analyticsRoutes.get(
  "/admin/overview",
  requireRole("admin"),
  asyncHandler(analyticsController.getAdminOverview),
);

// Student Performance Analytics Bundle (§15.6)
analyticsRoutes.get(
  "/students/:id",
  requireRole("student", "teacher", "admin"),
  validate(studentAnalyticsParamSchema, "params"),
  asyncHandler(analyticsController.getStudentAnalytics),
);

// Exam Summary Analytics (§15.6)
analyticsRoutes.get(
  "/exams/:id",
  requireRole("teacher", "admin"),
  validate(examAnalyticsParamSchema, "params"),
  asyncHandler(analyticsController.getExamAnalytics),
);

// Question Analytics per Exam (§15.6)
analyticsRoutes.get(
  "/exams/:id/questions",
  requireRole("teacher", "admin"),
  validate(examAnalyticsParamSchema, "params"),
  asyncHandler(analyticsController.getExamQuestionAnalytics),
);

// Subject Analytics (§15.6)
analyticsRoutes.get(
  "/subjects/:id",
  requireRole("teacher", "admin"),
  validate(subjectAnalyticsParamSchema, "params"),
  validate(subjectAnalyticsQuerySchema, "query"),
  asyncHandler(analyticsController.getSubjectAnalytics),
);
