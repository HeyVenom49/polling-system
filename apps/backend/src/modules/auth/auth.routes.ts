import { Router } from "express";
import { authenticate, validateBody } from "../../middleware/index.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import { authController } from "./auth.controller";

const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  authController.register,
);

authRouter.post("/login", validateBody(loginSchema), authController.login);

authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);

export default authRouter;
