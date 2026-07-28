import { z } from "zod";
import { USER_PLANS } from "@polling-system/shared";

export const updateUserRoleSchema = z
  .object({
    role: z.enum(["user", "creator", "admin"]),
  })
  .strict();

export const updateUserPlanSchema = z
  .object({
    plan: z.enum(USER_PLANS),
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

export const adminSearchUsersQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;
export type AdminListPollsQuery = z.infer<typeof adminListPollsQuerySchema>;
export type AdminSearchUsersQuery = z.infer<typeof adminSearchUsersQuerySchema>;
