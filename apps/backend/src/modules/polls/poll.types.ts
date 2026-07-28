import type { polls } from "../../database/schema";
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
  >
>;
