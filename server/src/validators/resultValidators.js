import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const attemptResultParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid attempt ID"),
  })
  .strict();

export const examLeaderboardParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, "Invalid exam ID"),
  })
  .strict();

export const leaderboardQuerySchema = z
  .object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n >= 1 && n <= 100, "Limit must be between 1 and 100")
      .optional(),
  })
  .strict();
