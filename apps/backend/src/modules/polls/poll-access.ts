import { ForbiddenError } from "../../errors/forbidden.error";
import { UnauthorizedError } from "../../errors/unauthorized.error";
import type { PublicPoll } from "./poll.types";

export function isPollExpired(poll: PublicPoll, now = new Date()): boolean {
  return poll.expireAt !== null && poll.expireAt <= now;
}

export function isPollCreator(
  poll: PublicPoll,
  viewerId: string | undefined,
): boolean {
  return viewerId !== undefined && poll.creatorId === viewerId;
}

/**
 * Public/viewer access to poll metadata and form content.
 * Owners and admins always pass (so they can manage closed/expired polls).
 */
export function assertPollReadable(
  poll: PublicPoll,
  viewerId?: string,
  viewerRole?: string,
): void {
  if (viewerRole === "admin" || isPollCreator(poll, viewerId)) {
    return;
  }

  if (poll.requireAuthentication && !viewerId) {
    throw new UnauthorizedError("Authentication required for this poll");
  }

  if (poll.status !== "open") {
    throw new ForbiddenError("Poll is closed");
  }

  if (isPollExpired(poll)) {
    throw new ForbiddenError("Poll is expired");
  }
}
