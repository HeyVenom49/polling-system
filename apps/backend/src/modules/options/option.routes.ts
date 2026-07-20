import { Router, type RequestHandler } from "express";
import type { OptionController } from "./option.controller";
import {
  validateBody,
  validateParams,
} from "../../middleware/validate.middleware";
import {
  createOptionSchema,
  optionQuestionParamsSchema,
  optionResourceParamsSchema,
  updateOptionSchema,
} from "./option.schema";

export type OptionRouterDeps = {
  controller: OptionController;
  authenticate: RequestHandler;
};

export function createOptionRouter({
  controller,
  authenticate,
}: OptionRouterDeps): Router {
  const optionRouter = Router({ mergeParams: true });

  optionRouter.post(
    "/",
    authenticate,
    validateParams(optionQuestionParamsSchema),
    validateBody(createOptionSchema),
    controller.create.bind(controller),
  );

  optionRouter.get(
    "/",
    validateParams(optionQuestionParamsSchema),
    controller.listByQuestionId.bind(controller),
  );

  optionRouter.get(
    "/:id",
    validateParams(optionResourceParamsSchema),
    controller.getById.bind(controller),
  );

  optionRouter.patch(
    "/:id",
    authenticate,
    validateParams(optionResourceParamsSchema),
    validateBody(updateOptionSchema),
    controller.update.bind(controller),
  );

  optionRouter.delete(
    "/:id",
    authenticate,
    validateParams(optionResourceParamsSchema),
    controller.delete.bind(controller),
  );

  return optionRouter;
}
