import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username can only 20 characters.")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid username");

export const passwordSchema = z.string().min(8).max(128);

export const emailSchema = z.string().trim().toLowerCase().email();

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  identifier: z.union([emailSchema, usernameSchema]),
  password: passwordSchema,
});

export const RegisterSchema = registerSchema.strict();
export const LoginSchema = loginSchema.strict();
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
