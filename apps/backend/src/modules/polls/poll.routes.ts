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
    controller.create,
  );

  pollRouter.get("/", authenticate, controller.listMine);

  pollRouter.get("/share/:shareId", controller.getByShareId);

  pollRouter.get("/:id", controller.getById);

  pollRouter.patch(
    "/:id",
    authenticate,
    validateBody(updatePollSchema),
    controller.update,
  );

  pollRouter.delete("/:id", authenticate, controller.delete);

  return pollRouter;
}
