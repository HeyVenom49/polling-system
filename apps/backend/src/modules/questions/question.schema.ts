import { z } from "zod";

export const questionPollParamsSchema = z
  .object({
    pollId: z.uuid(),
  })
  .strict();

export const questionResourceParamsSchema = z
  .object({
    pollId: z.uuid(),
    id: z.uuid(),
  })
  .strict();

export {
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  type CreateQuestionInput,
  type UpdateQuestionInput,
  type ReorderQuestionsInput,
} from "@polling-system/shared";
