import { type RequestHandler, Router } from "express";
import type { QuestionController } from "./question.controller";
import { validateBody } from "../../middleware/validate.middleware";
import { createQuestionSchema } from "./question.schema";
import { updatePollSchema } from "../polls/poll.schema";

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
    validateBody(createQuestionSchema),
    controller.create.bind(controller),
  );

  questionRouter.get("/", controller.listByPollId.bind(controller));

  questionRouter.get("/:id", controller.getById.bind(controller));

  questionRouter.patch(
    "/:id",
    authenticate,
    validateBody(updatePollSchema),
    controller.update.bind(controller),
  );

  questionRouter.delete(
    "/:id",
    authenticate,
    controller.delete.bind(controller),
  );

  return questionRouter;
}
