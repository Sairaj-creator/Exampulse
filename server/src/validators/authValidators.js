import { z } from "zod";

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordPattern,
        "Password must contain at least one letter and one number",
      ),
    batchId: z.string().regex(objectIdPattern, "Invalid batch ID format"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        passwordPattern,
        "New password must contain at least one letter and one number",
      ),
  })
  .strict();
