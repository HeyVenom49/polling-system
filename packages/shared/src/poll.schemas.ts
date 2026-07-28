import { z } from "zod";
import {
  DEFAULT_QUIZ_DURATION_SECONDS,
  POLL_MODES,
  POLL_STATUSES,
  QUIZ_DURATION_SECONDS,
} from "./constants";
import { DEFAULT_POLL_THEME_ID, POLL_THEME_IDS } from "./themes";

export const pollThemeIdSchema = z.enum(POLL_THEME_IDS);

export const createPollSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(2_000).optional(),
    expireAt: z.coerce
      .date()
      .refine((date) => date > new Date(), {
        message: "Expiration must be in the future.",
      })
      .optional(),
    requireAuthentication: z.boolean().default(false),
    mode: z.enum(POLL_MODES).default("poll"),
    questionDurationSec: z
      .number()
      .int()
      .refine(
        (value): value is (typeof QUIZ_DURATION_SECONDS)[number] =>
          (QUIZ_DURATION_SECONDS as readonly number[]).includes(value),
        { message: "Invalid question duration" },
      )
      .default(DEFAULT_QUIZ_DURATION_SECONDS),
    themeId: pollThemeIdSchema.default(DEFAULT_POLL_THEME_ID),
  })
  .strict();

export const updatePollSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(2_000).nullable().optional(),
    expireAt: z
      .union([
        z.coerce.date().refine((date) => date > new Date(), {
          message: "Expiration must be in the future.",
        }),
        z.null(),
      ])
      .optional(),
    requireAuthentication: z.boolean().optional(),
    questionDurationSec: z
      .number()
      .int()
      .refine(
        (value): value is (typeof QUIZ_DURATION_SECONDS)[number] =>
          (QUIZ_DURATION_SECONDS as readonly number[]).includes(value),
        { message: "Invalid question duration" },
      )
      .optional(),
    status: z.enum(POLL_STATUSES).optional(),
    resultPublished: z.boolean().optional(),
    themeId: pollThemeIdSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const listPollsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type ListPollsQuery = z.infer<typeof listPollsQuerySchema>;
