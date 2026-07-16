import type { Request, Response } from "express";
import { authService, type AuthService } from "./auth.service";

class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  async register(req: Request, res: Response) {
    const data = await this.service.register(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });
  }

  async login(req: Request, res: Response) {
    const data = await this.service.login(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  }
}

export const authController = new AuthController();
