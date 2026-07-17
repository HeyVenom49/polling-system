import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(50, "Username must be at most 50 characters.")
  .regex(
    /^[a-z0-9_-]+$/,
    "Username may contain only letters, numbers, underscores, and hyphens.",
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
    message: "Password must be at most 72 UTF-8 bytes.",
  });

const emailSchema = z.string().trim().toLowerCase().email();

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    identifier: z.union([emailSchema, usernameSchema]),
    password: passwordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
