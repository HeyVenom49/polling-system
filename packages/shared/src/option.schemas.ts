import { z } from "zod";

const displayOrderSchema = z.number().int().nonnegative().max(2_147_483_647);

export const createOptionSchema = z
  .object({
    value: z.string().trim().min(1).max(255),
    displayOrder: displayOrderSchema,
  })
  .strict();

export const updateOptionSchema = z
  .object({
    value: z.string().trim().min(1).max(255).optional(),
    displayOrder: displayOrderSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;
