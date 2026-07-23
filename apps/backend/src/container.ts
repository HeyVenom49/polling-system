import type { Express } from "express";
import type { Server } from "http";
import { createApp } from "./app";
import {
  createAuthenticate,
  createOptionalAuthenticate,
} from "./middleware/auth.middleware";
import { createResolveGuest } from "./middleware/guest.middleware";
import {
  createGlobalRateLimiter,
  createAuthRateLimiter,
} from "./middleware/rate-limit.middleware";
import { createRedisCache } from "./infrastructure/cache/redis-cache";
import { createPostgresClient } from "./infrastructure/postgres/postgres-client";
import { createRedisClient } from "./infrastructure/redis/redis-client";
import { MailService } from "./infrastructure/mail/mail.service";
import {
  attachSocketRedisAdapter,
  createSocketServer,
  type SocketServer,
} from "./infrastructure/socket/socket";
import { registerSocketHandlers } from "./infrastructure/socket/socket.handlers";
import { PollRealtime } from "./infrastructure/socket/poll-realtime";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthSessionRepository } from "./modules/auth/auth-session.repository";
import { AuthTokenRepository } from "./modules/auth/auth-token.repository";
import { AuthLockoutRepository } from "./modules/auth/auth-lockout.repository";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { PollController } from "./modules/polls/poll.controller";
import { PollQuotaRepository } from "./modules/polls/poll-quota.repository";
import { PollRepository } from "./modules/polls/poll.repository";
import { createPollRouter } from "./modules/polls/poll.routes";
import { PollService } from "./modules/polls/poll.services";
import { QuestionController } from "./modules/questions/question.controller";
import { QuestionRepository } from "./modules/questions/question.repository";
import { createQuestionRouter } from "./modules/questions/question.routes";
import { QuestionService } from "./modules/questions/question.service";
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
import { ResultRepository } from "./modules/results/result.repository";
import { ResultService } from "./modules/results/result.service";
import { ResultController } from "./modules/results/result.controller";
import { createResultRouter } from "./modules/results/result.routes";
import { QuizRepository } from "./modules/quiz/quiz.repository";
import { QuizService } from "./modules/quiz/quiz.service";
import { QuizController } from "./modules/quiz/quiz.controller";
import { createQuizRouter } from "./modules/quiz/quiz.routes";
import { AdminService } from "./modules/admin/admin.service";
import { AdminController } from "./modules/admin/admin.controller";
import { createAdminRouter } from "./modules/admin/admin.routes";
import { requireAdmin } from "./middleware/require-role.middleware";
import { createApiRouter } from "./routes/index";
import { createV1Router } from "./routes/v1Router";
import { createHttpServer } from "./server";

export type AppContainer = {
  app: Express;
  server: Server;
  io: SocketServer;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createContainer(): AppContainer {
  const postgres = createPostgresClient();
  const redis = createRedisClient();
  const pubClient = redis.client.duplicate();
  const subClient = redis.client.duplicate();
  const cache = createRedisCache(redis.client);

  const authRepository = new AuthRepository(postgres.db);
  const authSessionRepository = new AuthSessionRepository(cache);
  const authTokenRepository = new AuthTokenRepository(cache);
  const authLockoutRepository = new AuthLockoutRepository(cache);
  const pollQuotaRepository = new PollQuotaRepository(cache);
  const mailService = new MailService();
  const authService = new AuthService(
    authRepository,
    authSessionRepository,
    authTokenRepository,
    authLockoutRepository,
    mailService,
    pollQuotaRepository,
  );
  const authController = new AuthController(authService);
  const authenticate = createAuthenticate(authRepository);
  const optionalAuthenticate = createOptionalAuthenticate(authRepository);

  const pollRepository = new PollRepository(postgres.db);

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

  const pollRealtime = new PollRealtime();

  const resultRepository = new ResultRepository(postgres.db);
  const resultService = new ResultService(
    resultRepository,
    pollRepository,
    questionRepository,
    optionRepository,
  );
  const resultController = new ResultController(resultService);

  const pollService = new PollService(
    pollRepository,
    questionRepository,
    optionRepository,
    pollRealtime,
    resultService,
    pollQuotaRepository,
  );
  const pollController = new PollController(pollService);

  const responseRepository = new ResponseRepository(postgres.db);
  const responseService = new ResponseService(
    responseRepository,
    pollRepository,
    questionRepository,
    optionRepository,
    pollRealtime,
    resultService,
  );
  const responseController = new ResponseController(responseService);

  const quizRepository = new QuizRepository(postgres.db);
  const quizService = new QuizService(
    quizRepository,
    pollRepository,
    questionRepository,
    optionRepository,
    responseRepository,
    pollRealtime,
  );
  const quizController = new QuizController(quizService);

  const authRouter = createAuthRouter({
    controller: authController,
    authenticate,
    authRateLimiter: createAuthRateLimiter(redis.client),
  });
  const quizRouter = createQuizRouter({
    controller: quizController,
    authenticate,
    optionalAuthenticate,
  });
  const pollRouter = createPollRouter({
    controller: pollController,
    authenticate,
    optionalAuthenticate,
  });
  const questionRouter = createQuestionRouter({
    controller: questionController,
    authenticate,
    optionalAuthenticate,
  });
  const optionRouter = createOptionRouter({
    controller: optionController,
    authenticate,
    optionalAuthenticate,
  });
  const responseRouter = createResponseRouter({
    controller: responseController,
    optionalAuthenticate,
    resolveGuest,
  });
  const resultRouter = createResultRouter({
    controller: resultController,
    authenticate,
    optionalAuthenticate,
  });

  const adminService = new AdminService(authRepository, pollService);
  const adminController = new AdminController(adminService);
  const adminRouter = createAdminRouter({
    controller: adminController,
    authenticate,
    requireAdmin,
  });

  const v1Router = createV1Router({
    authRouter,
    pollRouter,
    quizRouter,
    questionRouter,
    optionRouter,
    responseRouter,
    resultRouter,
    adminRouter,
  });
  const apiRouter = createApiRouter(v1Router);
  const globalRateLimiter = createGlobalRateLimiter(redis.client);
  const app = createApp({ apiRouter, globalRateLimiter });
  const server = createHttpServer(app);
  const io = createSocketServer(server);
  registerSocketHandlers(io, {
    pollRepository,
    authRepository,
  });
  pollRealtime.attach(io);

  return {
    app,
    server,
    io,
    connect: async () => {
      await postgres.connect();
      await redis.connect();

      if (pubClient.status !== "ready") await pubClient.connect();
      if (subClient.status !== "ready") await subClient.connect();

      attachSocketRedisAdapter(io, pubClient, subClient);
    },
    disconnect: async () => {
      await io.close();
      await pubClient.quit();
      await subClient.quit();
      await redis.disconnect();
      await postgres.disconnect();
    },
  };
}
