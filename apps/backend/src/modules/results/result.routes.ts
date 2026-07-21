import { Router, type RequestHandler } from "express";
import type { ResultController } from "./result.controller";
import { validateParams } from "../../middleware/validate.middleware";
import { resultPollParamsSchema } from "./result.schema";

export type ResultRouterDeps = {
  controller: ResultController;
  optionalAuthenticate: RequestHandler;
};

export function createResultRouter({
  controller,
  optionalAuthenticate,
}: ResultRouterDeps): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    optionalAuthenticate,
    validateParams(resultPollParamsSchema),
    controller.getByPollId.bind(controller),
  );

  return router;
}
