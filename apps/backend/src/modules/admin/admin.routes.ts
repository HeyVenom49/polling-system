import { Router, type RequestHandler } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.middleware";
import type { AdminController } from "./admin.controller";
import {
  adminListPollsQuerySchema,
  adminUserParamsSchema,
  updateUserRoleSchema,
} from "./admin.schema";

export type AdminRouterDeps = {
  controller: AdminController;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
};

export function createAdminRouter({
  controller,
  authenticate,
  requireAdmin,
}: AdminRouterDeps): Router {
  const router = Router();

  router.use(authenticate, requireAdmin);

  router.get(
    "/polls",
    validateQuery(adminListPollsQuerySchema),
    controller.listPolls.bind(controller),
  );

  router.patch(
    "/users/:id/role",
    validateParams(adminUserParamsSchema),
    validateBody(updateUserRoleSchema),
    controller.updateUserRole.bind(controller),
  );

  return router;
}
