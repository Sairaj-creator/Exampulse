import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const studentAnalyticsParamSchema = z
  .object({
    id: z
      .string()
      .refine(
        (val) => val === "me" || objectIdRegex.test(val),
        "Invalid student ID (must be a valid ObjectId or 'me')",
      ),
  })
  .strict();

export const examAnalyticsParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid exam ID"),
  })
  .strict();

export const subjectAnalyticsParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid subject ID"),
  })
  .strict();

export const subjectAnalyticsQuerySchema = z
  .object({
    batchId: z
      .string()
      .regex(objectIdRegex, "Invalid batch ID")
      .optional(),
  })
  .strict();
