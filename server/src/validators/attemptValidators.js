import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const examAttemptParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid exam ID"),
  })
  .strict();

export const attemptIdParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid attempt ID"),
  })
  .strict();

export const saveAnswerParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid attempt ID"),
    questionId: z.string().regex(objectIdRegex, "Invalid question ID"),
  })
  .strict();

export const saveAnswerBodySchema = z
  .object({
    selectedKeys: z
      .array(z.string().trim().min(1).max(10))
      .max(6)
      .default([])
      .refine((keys) => new Set(keys).size === keys.length, {
        message: "Selected option keys must be unique",
      }),
    markedForReview: z.boolean().optional(),
  })
  .strict();

export const recordEventParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid attempt ID"),
  })
  .strict();

export const recordEventBodySchema = z
  .object({
    type: z.enum(["tab_hidden"]),
  })
  .strict();

export const resetAttemptParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid exam ID"),
    attemptId: z.string().regex(objectIdRegex, "Invalid attempt ID"),
  })
  .strict();

export const listStudentExamsQuerySchema = z
  .object({
    phase: z.enum(["upcoming", "live", "ended"]).optional(),
  })
  .strict();
