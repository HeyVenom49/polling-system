import { z } from "zod";

const displayOrderSchema = z.number().int().nonnegative().max(2_147_483_647);

export const createQuestionSchema = z
  .object({
    title: z.string().trim().min(3).max(500),
    isMandatory: z.boolean().default(true),
    displayOrder: displayOrderSchema,
  })
  .strict();

export const updateQuestionSchema = z
  .object({
    title: z.string().trim().min(3).max(500).optional(),
    isMandatory: z.boolean().optional(),
    displayOrder: displayOrderSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const reorderQuestionsSchema = z
  .object({
    orderedIds: z.array(z.uuid()).min(1),
  })
  .strict();

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
