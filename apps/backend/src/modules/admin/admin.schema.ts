import { z } from "zod";

export const updateUserRoleSchema = z
  .object({
    role: z.enum(["user", "creator", "admin"]),
  })
  .strict();

export const adminUserParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const adminListPollsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AdminListPollsQuery = z.infer<typeof adminListPollsQuerySchema>;
