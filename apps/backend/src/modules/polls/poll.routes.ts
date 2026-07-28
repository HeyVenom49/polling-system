import { Router, type RequestHandler } from "express";
import { validateBody } from "../../middleware/validate.middleware";
import { createPollSchema, updatePollSchema } from "./poll.schema";
import type { PollController } from "./poll.controller";

export type PollRouterDeps = {
  controller: PollController;
  authenticate: RequestHandler;
};

export function createPollRouter({
  controller,
  authenticate,
}: PollRouterDeps): Router {
  const pollRouter = Router();

  pollRouter.post(
    "/",
    authenticate,
    validateBody(createPollSchema),
    controller.create.bind(controller),
  );

  pollRouter.get("/", authenticate, controller.listMine.bind(controller));

  pollRouter.get(
    "/share/:shareId",
    controller.getByShareId.bind(controller),
  );

  pollRouter.get("/:id", controller.getById.bind(controller));

  pollRouter.patch(
    "/:id",
    authenticate,
    validateBody(updatePollSchema),
    controller.update.bind(controller),
  );

  pollRouter.delete(
    "/:id",
    authenticate,
    controller.delete.bind(controller),
  );

  return pollRouter;
}
