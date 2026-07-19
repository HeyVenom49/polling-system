import type { Express } from "express";
import type { Server } from "http";
import { createApp } from "./app";
import { createAuthenticate } from "./middleware/auth.middleware";
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

  const pollRepository = new PollRepository(postgres.db);
  const pollService = new PollService(pollRepository);
  const pollController = new PollController(pollService);

  const questionRepository = new QuestionRepository(postgres.db);
  const questionService = new QuestionService(questionRepository);
  const questionController = new QuestionController(questionService);

  const authRouter = createAuthRouter({
    controller: authController,
    authenticate,
  });
  const pollRouter = createPollRouter({
    controller: pollController,
    authenticate,
  });
  const questionRouter = createQuestionRouter({
    controller: questionController,
    authenticate,
  });
  const v1Router = createV1Router({ authRouter, pollRouter, questionRouter });
  const apiRouter = createApiRouter(v1Router);
  const app = createApp(apiRouter);
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
