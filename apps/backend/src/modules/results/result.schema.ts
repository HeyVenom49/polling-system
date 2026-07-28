import { z } from "zod";

export const resultPollParamsSchema = z
  .object({
    pollId: z.uuid(),
  })
  .strict();
