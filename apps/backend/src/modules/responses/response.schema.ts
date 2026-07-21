import { z } from "zod";

const answerItemSchema = z
  .object({
    questionId: z.uuid(),
    optionId: z.uuid(),
  })
  .strict();

export const submitResponseSchema = z
  .object({
    answers: z.array(answerItemSchema).min(1),
  })
  .strict();

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

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
