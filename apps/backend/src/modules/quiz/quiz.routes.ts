import { Router, type RequestHandler } from "express";
import {
  validateBody,
  validateParams,
} from "../../middleware/validate.middleware";
import type { QuizController } from "./quiz.controller";
import {
  quizPollIdParamsSchema,
  quizShareParamsSchema,
  startQuizQuestionSchema,
  submitQuizAnswerSchema,
} from "./quiz.schema";

export type QuizRouterDeps = {
  controller: QuizController;
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
};

/** Mount at `/polls` ahead of the main poll router. */
export function createQuizRouter({
  controller,
  authenticate,
  optionalAuthenticate,
}: QuizRouterDeps): Router {
  const router = Router();

  router.get(
    "/share/:shareId/quiz",
    optionalAuthenticate,
    validateParams(quizShareParamsSchema),
    controller.getStateByShareId.bind(controller),
  );

  router.get(
    "/:pollId/quiz/state",
    optionalAuthenticate,
    validateParams(quizPollIdParamsSchema),
    controller.getState.bind(controller),
  );

  router.get(
    "/:pollId/quiz/leaderboard",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    controller.getLeaderboard.bind(controller),
  );

  router.post(
    "/:pollId/quiz/questions/start",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    validateBody(startQuizQuestionSchema),
    controller.startQuestion.bind(controller),
  );

  router.post(
    "/:pollId/quiz/questions/close",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    controller.closeQuestion.bind(controller),
  );

  router.post(
    "/:pollId/quiz/finish",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    controller.finish.bind(controller),
  );

  router.post(
    "/:pollId/quiz/lobby",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    controller.resetToLobby.bind(controller),
  );

  router.post(
    "/:pollId/quiz/answers",
    authenticate,
    validateParams(quizPollIdParamsSchema),
    validateBody(submitQuizAnswerSchema),
    controller.submitAnswer.bind(controller),
  );

  return router;
}
