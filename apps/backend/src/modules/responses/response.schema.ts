import { z } from "zod";

export const responsePollParamsSchema = z
  .object({
    pollId: z.uuid(),
  })
  .strict();

export const responseResourceParamsSchema = z
  .object({
    pollId: z.uuid(),
    id: z.uuid(),
  })
  .strict();

export {
  submitResponseSchema,
  type SubmitResponseInput,
} from "@polling-system/shared";
