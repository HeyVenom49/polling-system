import { Router, type RequestHandler } from "express";
import { validateBody } from "../../middleware/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema";
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

  authRouter.post(
    "/verify-email",
    authRateLimiter,
    validateBody(verifyEmailSchema),
    controller.verifyEmail.bind(controller),
  );

  authRouter.post(
    "/resend-verification",
    authRateLimiter,
    validateBody(resendVerificationSchema),
    controller.resendVerification.bind(controller),
  );

  authRouter.post(
    "/forgot-password",
    authRateLimiter,
    validateBody(forgotPasswordSchema),
    controller.forgotPassword.bind(controller),
  );

  authRouter.post(
    "/reset-password",
    authRateLimiter,
    validateBody(resetPasswordSchema),
    controller.resetPassword.bind(controller),
  );

  authRouter.post(
    "/change-password",
    authenticate,
    validateBody(changePasswordSchema),
    controller.changePassword.bind(controller),
  );

  // Refresh is session maintenance, not credential guessing — do not share
  // the strict auth limiter (that was logging users out after ~15m idle).
  authRouter.post("/refresh", controller.refresh.bind(controller));
  authRouter.post("/logout", controller.logout.bind(controller));
  authRouter.get("/me", authenticate, controller.me.bind(controller));

  return authRouter;
}
