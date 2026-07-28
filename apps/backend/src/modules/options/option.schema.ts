import { z } from "zod";

export const optionQuestionParamsSchema = z
  .object({
    pollId: z.uuid(),
    questionId: z.uuid(),
  })
  .strict();

export const optionResourceParamsSchema = z
  .object({
    pollId: z.uuid(),
    questionId: z.uuid(),
    id: z.uuid(),
  })
  .strict();

export {
  createOptionSchema,
  updateOptionSchema,
  type CreateOptionInput,
  type UpdateOptionInput,
} from "@polling-system/shared";
