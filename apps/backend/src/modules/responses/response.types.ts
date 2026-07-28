import type { answers, responses } from "../../database/schema";

type ResponseRecord = typeof responses.$inferSelect;
type AnswerRecord = typeof answers.$inferSelect;

export type PublicResponse = Pick<
  ResponseRecord,
  "id" | "pollId" | "userId" | "guestId" | "submittedAt"
>;

export type PublicAnswer = Pick<
  AnswerRecord,
  "id" | "responseId" | "questionId" | "optionId"
>;

export type CreateResponseData = {
  pollId: string;
  userId?: string | null;
  guestId?: string | null;
};

export type CreateAnswerData = {
  questionId: string;
  optionId: string;
};

export type SubmitResponseData = {
  pollId: string;
  userId?: string | null;
  guestId?: string | null;
  answers: CreateAnswerData[];
};
