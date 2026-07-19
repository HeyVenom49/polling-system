import { z } from "zod";

export const createQuestionSchema = z
  .object({
    title: z.string().trim().min(3).max(500),
    isMandatory: z.boolean().default(true),
    displayOrder: z.number().int().nonnegative(),
  })
  .strict();

export const updateQuestionSchema = z
  .object({
    title: z.string().trim().min(3).max(500).optional(),
    isMandatory: z.boolean().optional(),
    displayOrder: z.number().int().nonnegative().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
