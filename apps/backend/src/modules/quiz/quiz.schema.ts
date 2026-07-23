export {
  startQuizQuestionSchema,
  submitQuizAnswerSchema,
  type StartQuizQuestionInput,
  type SubmitQuizAnswerInput,
} from "@polling-system/shared";
import { z } from "zod";

export const quizPollIdParamsSchema = z
  .object({
    pollId: z.string().uuid(),
  })
  .strict();

export const quizShareParamsSchema = z
  .object({
    shareId: z.string().min(1),
  })
  .strict();
