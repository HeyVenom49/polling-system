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
    controller.register,
  );

  authRouter.post("/login", validateBody(loginSchema), controller.login);

  authRouter.post("/refresh", controller.refresh);
  authRouter.post("/logout", controller.logout);
  authRouter.get("/me", authenticate, controller.me);

  return authRouter;
}
