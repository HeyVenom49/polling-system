import { describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";
import type { PublicUser } from "./auth.types";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
});

const { authController } = await import("./auth.controller");

const user: PublicUser = {
  id: "8e464d7e-2d95-4c7f-a9ac-3d6f33053085",
  username: "pollster",
  email: "pollster@example.com",
  role: "user",
  isEmailVerified: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createResponse() {
  const json = mock((body: unknown) => body);
  const response = {
    status: mock(() => response),
    json,
  } as unknown as Response;

  return { json, response };
}

describe("AuthController.me", () => {
  test("returns the user resolved by authentication middleware", async () => {
    const { json, response } = createResponse();

    await authController.me({ user } as Request, response);

    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "Current user fetched successfully",
      data: user,
    });
  });

  test("rejects a request without an authenticated user", async () => {
    const { response } = createResponse();

    await expect(
      authController.me({} as Request, response),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
