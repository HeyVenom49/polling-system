import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username can only 20 characters.")
    .regex(/^[A-Za-z0-9_-]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const RegisterSchema = registerSchema.strict();
export type RegisterInput = z.infer<typeof RegisterSchema>;
