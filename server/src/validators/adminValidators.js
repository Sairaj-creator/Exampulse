import { z } from "zod";

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const idParamSchema = z
  .object({ id: z.string().regex(objectIdPattern, "Invalid resource ID") })
  .strict();

export const listUsersQuerySchema = z
  .object({
    role: z.enum(["admin", "teacher", "student"]).optional(),
    batchId: z.string().regex(objectIdPattern).optional(),
    search: z.string().optional(),
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === "true")),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordPattern,
        "Password must contain at least one letter and one number",
      ),
    role: z.enum(["admin", "teacher", "student"]),
    batchId: z.string().regex(objectIdPattern).optional().nullable(),
    rollNumber: z.string().trim().optional().nullable(),
  })
  .strict()
  .refine((data) => (data.role === "student" ? !!data.batchId : true), {
    message: "Batch is required for students",
    path: ["batchId"],
  });

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    role: z.enum(["admin", "teacher", "student"]).optional(),
    batchId: z.string().regex(objectIdPattern).nullable().optional(),
    rollNumber: z.string().trim().nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export const updateUserStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const adminResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordPattern,
        "Password must contain at least one letter and one number",
      ),
  })
  .strict();

export const batchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50),
    year: z.coerce.number().int().min(2000).max(2100),
  })
  .strict();

export const updateBatchSchema = batchSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export const subjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100),
    code: z.string().trim().min(2).max(20).toUpperCase(),
    description: z.string().trim().max(500).optional().default(""),
  })
  .strict();

export const updateSubjectSchema = subjectSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );
