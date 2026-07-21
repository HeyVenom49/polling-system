import type { PublicPoll } from "../../modules/polls/poll.types";
import type { PollResults } from "../../modules/results/result.types";

export const SocketClientEvents = {
  joinPoll: "joinPoll",
  leavePoll: "leavePoll",
} as const;

export const SocketServerEvents = {
  joinedPoll: "joinedPoll",
  leftPoll: "leftPoll",
  error: "error",
  responseSubmitted: "responseSubmitted",
  resultsUpdated: "resultsUpdated",
  pollUpdated: "pollUpdated",
  pollDeleted: "pollDeleted",
} as const;

export type SocketClientEvent =
  (typeof SocketClientEvents)[keyof typeof SocketClientEvents];

export type SocketServerEvent =
  (typeof SocketServerEvents)[keyof typeof SocketServerEvents];

export type PollIdPayload = {
  pollId: string;
};

export type SocketErrorPayload = {
  message: string;
};

export type ResponseSubmittedPayload = {
  pollId: string;
  totalResponses: number;
};

export type PollDeletedPayload = {
  pollId: string;
};

export type ClientToServerEvents = {
  [SocketClientEvents.joinPoll]: (payload: PollIdPayload) => void;
  [SocketClientEvents.leavePoll]: (payload: PollIdPayload) => void;
};

export type ServerToClientEvents = {
  [SocketServerEvents.joinedPoll]: (payload: PollIdPayload) => void;
  [SocketServerEvents.leftPoll]: (payload: PollIdPayload) => void;
  [SocketServerEvents.error]: (payload: SocketErrorPayload) => void;
  [SocketServerEvents.responseSubmitted]: (
    payload: ResponseSubmittedPayload,
  ) => void;
  [SocketServerEvents.resultsUpdated]: (payload: PollResults) => void;
  [SocketServerEvents.pollUpdated]: (payload: PublicPoll) => void;
  [SocketServerEvents.pollDeleted]: (payload: PollDeletedPayload) => void;
};
