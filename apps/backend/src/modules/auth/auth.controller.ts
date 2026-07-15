import type { Request, Response } from "express";
import { RegisterSchema } from "./auth.schema";
import { authService, type AuthService } from "./auth.service";

class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  async register(req: Request, res: Response) {
    const data = RegisterSchema.parse(req.body);
    const user = await this.service.register(data);
    return res.status(201).json({
      success: true,
      message: "User register successfully",
      user,
    });
  }
}

export const authController = new AuthController();
