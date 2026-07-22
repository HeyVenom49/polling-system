import type { polls } from "../../database/schema";
import type { PublicOption } from "../options/option.types";
import type { PublicQuestion } from "../questions/question.types";
import type { CreatePollInput } from "./poll.schema";

type PollRecord = typeof polls.$inferSelect;

export type PublicPoll = Pick<
  PollRecord,
  | "id"
  | "title"
  | "description"
  | "creatorId"
  | "requireAuthentication"
  | "expireAt"
  | "status"
  | "resultPublished"
  | "themeId"
  | "shareId"
  | "createdAt"
  | "updatedAt"
>;

export type CreatePollData = CreatePollInput & {
  creatorId: string;
  shareId: string;
};

export type UpdatePollData = Partial<
  Pick<
    PollRecord,
    | "title"
    | "description"
    | "expireAt"
    | "requireAuthentication"
    | "status"
    | "resultPublished"
    | "themeId"
  >
>;

export type PollFormQuestion = PublicQuestion & {
  options: PublicOption[];
};

export type PollForm = {
  poll: PublicPoll;
  questions: PollFormQuestion[];
};

export type PaginatedPolls = {
  items: PublicPoll[];
  total: number;
  limit: number;
  offset: number;
};
