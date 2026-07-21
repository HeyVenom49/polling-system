import type { Express } from "express";
import type { Server } from "http";
import { createApp } from "./app";
import {
  createAuthenticate,
  createOptionalAuthenticate,
} from "./middleware/auth.middleware";
import { createResolveGuest } from "./middleware/guest.middleware";
import { createGlobalRateLimiter, createAuthRateLimiter } from "./middleware/rate-limit.middleware";
import { createRedisCache } from "./infrastructure/cache/redis-cache";
import { createPostgresClient } from "./infrastructure/postgres/postgres-client";
import { createRedisClient } from "./infrastructure/redis/redis-client";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthSessionRepository } from "./modules/auth/auth-session.repository";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { PollController } from "./modules/polls/poll.controller";
import { PollRepository } from "./modules/polls/poll.repository";
import { createPollRouter } from "./modules/polls/poll.routes";
import { PollService } from "./modules/polls/poll.services";
import { QuestionController } from "./modules/questions/question.controller";
import { QuestionRepository } from "./modules/questions/question.repository";
import { createQuestionRouter } from "./modules/questions/question.routes";
import { QuestionService } from "./modules/questions/question.service";
import { createApiRouter } from "./routes/index";
import { createV1Router } from "./routes/v1Router";
import { createHttpServer } from "./server";
import { OptionRepository } from "./modules/options/option.repository";
import { OptionService } from "./modules/options/option.service";
import { OptionController } from "./modules/options/option.controller";
import { createOptionRouter } from "./modules/options/option.routes";
import { GuestRepository } from "./modules/guests/guest.repository";
import { GuestService } from "./modules/guests/guest.service";
import { ResponseRepository } from "./modules/responses/response.repository";
import { ResponseService } from "./modules/responses/response.service";
import { ResponseController } from "./modules/responses/response.controller";
import { createResponseRouter } from "./modules/responses/response.routes";

export type AppContainer = {
  app: Express;
  server: Server;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createContainer(): AppContainer {
  const postgres = createPostgresClient();
  const redis = createRedisClient();
  const cache = createRedisCache(redis.client);

  const authRepository = new AuthRepository(postgres.db);
  const authSessionRepository = new AuthSessionRepository(cache);
  const authService = new AuthService(authRepository, authSessionRepository);
  const authController = new AuthController(authService);
  const authenticate = createAuthenticate(authRepository);
  const optionalAuthenticate = createOptionalAuthenticate(authRepository);

  const pollRepository = new PollRepository(postgres.db);
  const pollService = new PollService(pollRepository);
  const pollController = new PollController(pollService);

  const questionRepository = new QuestionRepository(postgres.db);
  const questionService = new QuestionService(
    questionRepository,
    pollRepository,
  );
  const questionController = new QuestionController(questionService);

  const optionRepository = new OptionRepository(postgres.db);
  const optionService = new OptionService(
    optionRepository,
    questionRepository,
    pollRepository,
  );
  const optionController = new OptionController(optionService);

  const guestRepository = new GuestRepository(postgres.db);
  const guestService = new GuestService(guestRepository);
  const resolveGuest = createResolveGuest(guestService);

  const responseRepository = new ResponseRepository(postgres.db);
  const responseService = new ResponseService(
    responseRepository,
    pollRepository,
    questionRepository,
    optionRepository,
  );
  const responseController = new ResponseController(responseService);

  const authRouter = createAuthRouter({
    controller: authController,
    authenticate,
    authRateLimiter: createAuthRateLimiter(redis.client),
  });
  const pollRouter = createPollRouter({
    controller: pollController,
    authenticate,
  });
  const questionRouter = createQuestionRouter({
    controller: questionController,
    authenticate,
  });
  const optionRouter = createOptionRouter({
    controller: optionController,
    authenticate,
  });
  const responseRouter = createResponseRouter({
    controller: responseController,
    optionalAuthenticate,
    resolveGuest,
  });

  const v1Router = createV1Router({
    authRouter,
    pollRouter,
    questionRouter,
    optionRouter,
    responseRouter,
  });
  const apiRouter = createApiRouter(v1Router);
  const globalRateLimiter = createGlobalRateLimiter(redis.client);
  const app = createApp({ apiRouter, globalRateLimiter });
  const server = createHttpServer(app);

  return {
    app,
    server,
    connect: async () => {
      await postgres.connect();
      await redis.connect();
    },
    disconnect: async () => {
      await postgres.disconnect();
      await redis.disconnect();
    },
  };
}
