import { Router, type RequestHandler } from "express";
import type { ResultController } from "./result.controller";
import { validateParams } from "../../middleware/validate.middleware";
import { resultPollParamsSchema } from "./result.schema";

export type ResultRouterDeps = {
  controller: ResultController;
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
};

export function createResultRouter({
  controller,
  authenticate,
  optionalAuthenticate,
}: ResultRouterDeps): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    optionalAuthenticate,
    validateParams(resultPollParamsSchema),
    controller.getByPollId.bind(controller),
  );

  router.get(
    "/analytics",
    authenticate,
    validateParams(resultPollParamsSchema),
    controller.getAnalytics.bind(controller),
  );

  return router;
}
