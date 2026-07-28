import { Router, type RequestHandler } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.middleware";
import {
  createPollSchema,
  listPollsQuerySchema,
  pollIdParamsSchema,
  pollShareParamsSchema,
  updatePollSchema,
} from "./poll.schema";
import type { PollController } from "./poll.controller";

export type PollRouterDeps = {
  controller: PollController;
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
};

export function createPollRouter({
  controller,
  authenticate,
  optionalAuthenticate,
}: PollRouterDeps): Router {
  const pollRouter = Router();

  pollRouter.post(
    "/",
    authenticate,
    validateBody(createPollSchema),
    controller.create.bind(controller),
  );

  pollRouter.get(
    "/",
    authenticate,
    validateQuery(listPollsQuerySchema),
    controller.listMine.bind(controller),
  );

  pollRouter.get(
    "/share/:shareId/form",
    optionalAuthenticate,
    validateParams(pollShareParamsSchema),
    controller.getFormByShareId.bind(controller),
  );

  pollRouter.get(
    "/share/:shareId",
    optionalAuthenticate,
    validateParams(pollShareParamsSchema),
    controller.getByShareId.bind(controller),
  );

  pollRouter.get(
    "/:id",
    optionalAuthenticate,
    validateParams(pollIdParamsSchema),
    controller.getById.bind(controller),
  );

  pollRouter.patch(
    "/:id",
    authenticate,
    validateParams(pollIdParamsSchema),
    validateBody(updatePollSchema),
    controller.update.bind(controller),
  );

  pollRouter.delete(
    "/:id",
    authenticate,
    validateParams(pollIdParamsSchema),
    controller.delete.bind(controller),
  );

  return pollRouter;
}
