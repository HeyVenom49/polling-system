import { z } from "zod";

export const createPollSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(2_000).optional(),
    expireAt: z.coerce
      .date()
      .refine((date) => date > new Date(), {
        message: "Expiration must be in the future.",
      })
      .optional(),
    requireAuthentication: z.boolean().default(false),
  })
  .strict();

export const updatePollSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(2_000).nullable().optional(),
    expireAt: z
      .union([
        z.coerce.date().refine((date) => date > new Date(), {
          message: "Expiration must be in the future.",
        }),
        z.null(),
      ])
      .optional(),
    requireAuthentication: z.boolean().optional(),
    status: z.enum(["open", "closed"]).optional(),
    resultPublished: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
