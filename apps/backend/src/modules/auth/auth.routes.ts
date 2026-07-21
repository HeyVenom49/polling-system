import { Router, type RequestHandler } from "express";
import { validateBody } from "../../middleware/validate.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import type { AuthController } from "./auth.controller";

export type AuthRouterDeps = {
  controller: AuthController;
  authenticate: RequestHandler;
  authRateLimiter: RequestHandler;
};

export function createAuthRouter({
  controller,
  authenticate,
  authRateLimiter,
}: AuthRouterDeps): Router {
  const authRouter = Router();

  authRouter.post(
    "/register",
    authRateLimiter,
    validateBody(registerSchema),
    controller.register.bind(controller),
  );

  authRouter.post(
    "/login",
    authRateLimiter,
    validateBody(loginSchema),
    controller.login.bind(controller),
  );

  authRouter.post("/refresh", authRateLimiter, controller.refresh.bind(controller));
  authRouter.post("/logout", controller.logout.bind(controller));
  authRouter.get("/me", authenticate, controller.me.bind(controller));

  return authRouter;
}
