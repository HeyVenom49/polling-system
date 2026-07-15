import { Router } from "express";
import { validate as validateRequest } from "../../middleware/validate.middleware";
import { RegisterSchema } from "./auth.schema";
import { authController } from "./auth.controller";

const router = Router();

router.post(
  "/register",
  validateRequest(RegisterSchema),
  authController.register.bind(authController),
);

export default router;
