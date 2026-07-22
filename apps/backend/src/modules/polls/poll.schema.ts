import { z } from "zod";

export const pollIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const pollShareParamsSchema = z
  .object({
    shareId: z.uuid(),
  })
  .strict();

export {
  createPollSchema,
  updatePollSchema,
  listPollsQuerySchema,
  pollThemeIdSchema,
  type CreatePollInput,
  type UpdatePollInput,
  type ListPollsQuery,
} from "@polling-system/shared";
