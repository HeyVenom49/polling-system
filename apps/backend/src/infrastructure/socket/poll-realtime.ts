import type { PublicPoll } from "../../modules/polls/poll.types";
import type { PollResults } from "../../modules/results/result.types";
import { pollRoom } from "./rooms";
import {
  SocketServerEvents,
  type PollDeletedPayload,
  type ResponseSubmittedPayload,
} from "./socket.events";
import type { SocketServer } from "./socket";

export class PollRealtime {
  private io: SocketServer | null = null;

  attach(io: SocketServer): void {
    this.io = io;
  }

  responseSubmitted(pollId: string, totalResponses: number): void {
    const payload: ResponseSubmittedPayload = { pollId, totalResponses };
    this.io
      ?.to(pollRoom(pollId))
      .emit(SocketServerEvents.responseSubmitted, payload);
  }

  resultsUpdated(results: PollResults): void {
    this.io
      ?.to(pollRoom(results.pollId))
      .emit(SocketServerEvents.resultsUpdated, results);
  }

  pollUpdated(poll: PublicPoll): void {
    this.io?.to(pollRoom(poll.id)).emit(SocketServerEvents.pollUpdated, poll);
  }

  pollDeleted(pollId: string): void {
    const payload: PollDeletedPayload = { pollId };
    this.io
      ?.to(pollRoom(pollId))
      .emit(SocketServerEvents.pollDeleted, payload);
  }
}
