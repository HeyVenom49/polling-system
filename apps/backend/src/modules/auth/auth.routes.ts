import { Router, type RequestHandler } from "express";
import { validateBody } from "../../middleware/validate.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import type { AuthController } from "./auth.controller";

export type AuthRouterDeps = {
  controller: AuthController;
  authenticate: RequestHandler;
};

export function createAuthRouter({
  controller,
  authenticate,
}: AuthRouterDeps): Router {
  const authRouter = Router();

  authRouter.post(
    "/register",
    validateBody(registerSchema),
    controller.register.bind(controller),
  );

  authRouter.post(
    "/login",
    validateBody(loginSchema),
    controller.login.bind(controller),
  );

  authRouter.post("/refresh", controller.refresh.bind(controller));
  authRouter.post("/logout", controller.logout.bind(controller));
  authRouter.get("/me", authenticate, controller.me.bind(controller));

  return authRouter;
}
