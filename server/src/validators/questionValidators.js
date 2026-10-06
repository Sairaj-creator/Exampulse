import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const optionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, "Option key is required")
      .max(5)
      .toUpperCase(),
    text: z.string().trim().min(1, "Option text cannot be empty"),
  })
  .strict();

export const listQuestionsQuerySchema = z
  .object({
    subjectId: z.string().regex(objectIdPattern, "Invalid subject ID").optional(),
    topic: z.string().trim().optional(),
    type: z.enum(["single", "multiple", "truefalse"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    search: z.string().trim().optional(),
    includeArchived: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const getTopicsQuerySchema = z
  .object({
    subjectId: z.string().regex(objectIdPattern, "Invalid subject ID").optional(),
  })
  .strict();

export const createQuestionSchema = z
  .object({
    subjectId: z.string().regex(objectIdPattern, "Invalid subject ID"),
    topic: z
      .string()
      .trim()
      .min(2, "Topic must be at least 2 characters")
      .max(100, "Topic cannot exceed 100 characters"),
    type: z.enum(["single", "multiple", "truefalse"], {
      required_error: "Question type is required",
    }),
    text: z
      .string()
      .trim()
      .min(5, "Question text must be at least 5 characters"),
    options: z.array(optionSchema).min(2, "At least 2 options are required"),
    correctKeys: z.array(z.string().trim().toUpperCase()).min(1, "At least 1 correct key is required"),
    explanation: z.string().trim().optional().default(""),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    defaultMarks: z.coerce.number().min(0.5, "Marks must be at least 0.5").max(100, "Marks cannot exceed 100").default(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    // 1. Validate options count per type
    if (data.type === "truefalse") {
      if (data.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "True/False questions must have exactly 2 options (A=True, B=False)",
        });
      }
    } else {
      if (data.options.length < 2 || data.options.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Questions must have between 2 and 6 options",
        });
      }
    }

    // 2. Validate distinct option keys
    const optionKeys = data.options.map((opt) => opt.key);
    const uniqueKeys = new Set(optionKeys);
    if (uniqueKeys.size !== optionKeys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Option keys must be distinct",
      });
    }

    if (new Set(data.correctKeys).size !== data.correctKeys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctKeys"],
        message: "Correct keys must be distinct",
      });
    }

    // 3. Validate correctKeys count per type
    if (data.type === "single" || data.type === "truefalse") {
      if (data.correctKeys.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctKeys"],
          message: `${data.type === "truefalse" ? "True/False" : "Single choice"} questions must have exactly 1 correct answer`,
        });
      }
    } else if (data.type === "multiple") {
      if (data.correctKeys.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctKeys"],
          message: "Multiple choice questions must have at least 1 correct answer",
        });
      }
    }

    // 4. Validate that all correctKeys exist in options
    for (const key of data.correctKeys) {
      if (!uniqueKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctKeys"],
          message: `Correct key '${key}' does not match any provided option key`,
        });
      }
    }
  });

export const updateQuestionSchema = z
  .object({
    subjectId: z.string().regex(objectIdPattern, "Invalid subject ID").optional(),
    topic: z
      .string()
      .trim()
      .min(2, "Topic must be at least 2 characters")
      .max(100, "Topic cannot exceed 100 characters")
      .optional(),
    type: z.enum(["single", "multiple", "truefalse"]).optional(),
    text: z
      .string()
      .trim()
      .min(5, "Question text must be at least 5 characters")
      .optional(),
    options: z.array(optionSchema).min(2).optional(),
    correctKeys: z.array(z.string().trim().toUpperCase()).min(1).optional(),
    explanation: z.string().trim().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    defaultMarks: z.coerce.number().min(0.5).max(100).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one field to update",
      });
    }

    if (data.correctKeys && new Set(data.correctKeys).size !== data.correctKeys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctKeys"],
        message: "Correct keys must be distinct",
      });
    }
    // If options or correctKeys or type are provided together, validate consistency
    if (data.options && data.type) {
      if (data.type === "truefalse" && data.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "True/False questions must have exactly 2 options",
        });
      } else if (data.type !== "truefalse" && (data.options.length < 2 || data.options.length > 6)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Questions must have between 2 and 6 options",
        });
      }
    }

    if (data.options) {
      const optionKeys = data.options.map((opt) => opt.key);
      const uniqueKeys = new Set(optionKeys);
      if (uniqueKeys.size !== optionKeys.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Option keys must be distinct",
        });
      }

      if (data.correctKeys) {
        for (const key of data.correctKeys) {
          if (!uniqueKeys.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["correctKeys"],
              message: `Correct key '${key}' does not match any provided option key`,
            });
          }
        }
      }
    }

    if (data.correctKeys && data.type) {
      if ((data.type === "single" || data.type === "truefalse") && data.correctKeys.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctKeys"],
          message: "Single or True/False questions must have exactly 1 correct key",
        });
      }
    }
  });
