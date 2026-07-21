import { Router, type RequestHandler } from "express";
import type { ResponseController } from "./response.controller";
import {
  validateBody,
  validateParams,
} from "../../middleware/validate.middleware";
import {
  responsePollParamsSchema,
  responseResourceParamsSchema,
  submitResponseSchema,
} from "./response.schema";

export type ResponseRouterDeps = {
  controller: ResponseController;
  optionalAuthenticate: RequestHandler;
  resolveGuest: RequestHandler;
};

export function createResponseRouter({
  controller,
  optionalAuthenticate,
  resolveGuest,
}: ResponseRouterDeps): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/",
    optionalAuthenticate,
    resolveGuest,
    validateParams(responsePollParamsSchema),
    validateBody(submitResponseSchema),
    controller.submit.bind(controller),
  );

  router.get(
    "/:id",
    validateParams(responseResourceParamsSchema),
    controller.getById.bind(controller),
  );

  return router;
}
