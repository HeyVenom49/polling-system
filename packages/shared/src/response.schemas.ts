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

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
