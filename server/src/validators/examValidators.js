import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid resource ID");
const text = (max) => z.string().trim().max(max);

const examFields = {
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150),
  description: text(2000),
  instructions: text(5000),
  subjectId: objectId,
  batchIds: z.array(objectId).max(100),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  passPercentage: z.coerce.number().min(0).max(100),
  negativeMarking: z
    .object({
      enabled: z.boolean(),
      penaltyFraction: z.coerce.number().min(0).max(1),
    })
    .strict(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  reviewPolicy: z.enum(["immediate", "after_end", "never"]),
};

function validateSchedule(data, context) {
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
  if (data.startTime && data.endTime && data.durationMinutes) {
    const windowMinutes =
      (data.endTime.getTime() - data.startTime.getTime()) / 60000;
    if (data.durationMinutes > windowMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationMinutes"],
        message: "Duration cannot exceed the exam window",
      });
    }
  }
  if (data.batchIds && new Set(data.batchIds).size !== data.batchIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["batchIds"],
      message: "Batch assignments must be unique",
    });
  }
}

export const listExamsQuerySchema = z
  .object({
    status: z.enum(["draft", "published", "archived"]).optional(),
    subjectId: objectId.optional(),
    phase: z.enum(["upcoming", "live", "ended"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const createExamSchema = z
  .object({
    ...examFields,
    description: examFields.description.optional().default(""),
    instructions: examFields.instructions.optional().default(""),
    batchIds: examFields.batchIds.optional().default([]),
    passPercentage: examFields.passPercentage.optional().default(40),
    negativeMarking: examFields.negativeMarking
      .partial()
      .optional()
      .default({ enabled: false, penaltyFraction: 0.25 }),
    shuffleQuestions: examFields.shuffleQuestions.optional().default(false),
    shuffleOptions: examFields.shuffleOptions.optional().default(false),
    reviewPolicy: examFields.reviewPolicy.optional().default("immediate"),
  })
  .strict()
  .superRefine(validateSchedule);

export const updateExamSchema = z
  .object(
    Object.fromEntries(
      Object.entries(examFields).map(([key, schema]) => [
        key,
        schema.optional(),
      ]),
    ),
  )
  .strict()
  .superRefine((data, context) => {
    if (Object.keys(data).length === 0)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one field to update",
      });
    validateSchedule(data, context);
  });

export const examIdParamSchema = z.object({ id: objectId }).strict();
export const examQuestionParamSchema = z
  .object({ id: objectId, questionId: objectId })
  .strict();

export const addExamQuestionsSchema = z
  .object({
    questionIds: z
      .array(objectId)
      .min(1, "Select at least one question")
      .max(200),
  })
  .strict()
  .superRefine((data, context) => {
    if (new Set(data.questionIds).size !== data.questionIds.length)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionIds"],
        message: "Question IDs must be unique",
      });
  });

export const updateExamQuestionSchema = z
  .object({ marks: z.coerce.number().min(0.5).max(100) })
  .strict();
export const reorderExamQuestionsSchema = z
  .object({ orderedIds: z.array(objectId).max(200) })
  .strict();
export const duplicateExamSchema = z
  .object({ title: z.string().trim().min(3).max(150).optional() })
  .strict();
