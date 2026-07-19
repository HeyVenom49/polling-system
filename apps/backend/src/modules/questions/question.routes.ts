import { type RequestHandler, Router } from "express";
import {
  validateBody,
  validateParams,
} from "../../middleware/validate.middleware";
import type { QuestionController } from "./question.controller";
import {
  createQuestionSchema,
  questionPollParamsSchema,
  questionResourceParamsSchema,
  updateQuestionSchema,
} from "./question.schema";

export type QuestionRouterDeps = {
  controller: QuestionController;
  authenticate: RequestHandler;
};

export function createQuestionRouter({
  controller,
  authenticate,
}: QuestionRouterDeps): Router {
  const questionRouter = Router({ mergeParams: true });

  questionRouter.post(
    "/",
    authenticate,
    validateParams(questionPollParamsSchema),
    validateBody(createQuestionSchema),
    controller.create.bind(controller),
  );

  questionRouter.get(
    "/",
    validateParams(questionPollParamsSchema),
    controller.listByPollId.bind(controller),
  );

  questionRouter.get(
    "/:id",
    validateParams(questionResourceParamsSchema),
    controller.getById.bind(controller),
  );

  questionRouter.patch(
    "/:id",
    authenticate,
    validateParams(questionResourceParamsSchema),
    validateBody(updateQuestionSchema),
    controller.update.bind(controller),
  );

  questionRouter.delete(
    "/:id",
    authenticate,
    validateParams(questionResourceParamsSchema),
    controller.delete.bind(controller),
  );

  return questionRouter;
}
