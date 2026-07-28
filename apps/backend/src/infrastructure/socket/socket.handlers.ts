import { z } from "zod";
import { JsonWebTokenError } from "jsonwebtoken";
import { verifyAccessToken } from "../../utils/jwt";
import type { AuthRepository } from "../../modules/auth/auth.repository";
import type { PollRepository } from "../../modules/polls/poll.repository";
import { assertPollReadable } from "../../modules/polls/poll-access";
import { pollCreatorRoom, pollRoom } from "./rooms";
import { SocketClientEvents, SocketServerEvents } from "./socket.events";
import type { SocketServer } from "./socket";

function isAdminRole(role: string | undefined): boolean {
  return role === "admin";
}

const pollIdPayloadSchema = z
  .object({
    pollId: z.uuid(),
  })
  .strict();

export type SocketHandlerDeps = {
  pollRepository: PollRepository;
  authRepository: AuthRepository;
};

export function registerSocketHandlers(
  io: SocketServer,
  deps: SocketHandlerDeps,
): void {
  io.use((socket, next) => {
    const rawToken = socket.handshake.auth.token;

    if (typeof rawToken !== "string" || rawToken.length === 0) {
      next();
      return;
    }

    void (async () => {
      try {
        const payload = verifyAccessToken(rawToken);
        const user = await deps.authRepository.findById(payload.sub);

        if (user) {
          socket.data.userId = user.id;
          socket.data.userRole = user.role;
        }

        next();
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          next();
          return;
        }
        next(error instanceof Error ? error : new Error("Socket auth failed"));
      }
    })();
  });

  io.on("connection", (socket) => {
    socket.on(SocketClientEvents.joinPoll, (payload) => {
      void (async () => {
        const parsed = pollIdPayloadSchema.safeParse(payload);

        if (!parsed.success) {
          socket.emit(SocketServerEvents.error, { message: "Invalid pollId" });
          return;
        }

        const { pollId } = parsed.data;
        const poll = await deps.pollRepository.findById(pollId);

        if (!poll) {
          socket.emit(SocketServerEvents.error, {
            message: "Poll not found",
          });
          return;
        }

        try {
          assertPollReadable(poll, socket.data.userId, socket.data.userRole);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Cannot join poll";
          socket.emit(SocketServerEvents.error, { message });
          return;
        }

        void socket.join(pollRoom(pollId));

        if (
          socket.data.userId === poll.creatorId ||
          isAdminRole(socket.data.userRole)
        ) {
          void socket.join(pollCreatorRoom(pollId));
        }

        socket.emit(SocketServerEvents.joinedPoll, { pollId });
      })();
    });

    socket.on(SocketClientEvents.leavePoll, (payload) => {
      const parsed = pollIdPayloadSchema.safeParse(payload);

      if (!parsed.success) {
        socket.emit(SocketServerEvents.error, { message: "Invalid pollId" });
        return;
      }

      const { pollId } = parsed.data;
      void socket.leave(pollRoom(pollId));
      void socket.leave(pollCreatorRoom(pollId));
      socket.emit(SocketServerEvents.leftPoll, { pollId });
    });
  });
}
