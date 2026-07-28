import { z } from "zod";
import { QUIZ_DURATION_SECONDS } from "./constants";

export const startQuizQuestionSchema = z
  .object({
    questionId: z.string().uuid(),
    durationSeconds: z
      .number()
      .int()
      .refine(
        (value): value is (typeof QUIZ_DURATION_SECONDS)[number] =>
          (QUIZ_DURATION_SECONDS as readonly number[]).includes(value),
        { message: "Invalid question duration" },
      )
      .optional(),
  })
  .strict();

export const submitQuizAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    optionId: z.string().uuid(),
  })
  .strict();

export type StartQuizQuestionInput = z.infer<typeof startQuizQuestionSchema>;
export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerSchema>;
