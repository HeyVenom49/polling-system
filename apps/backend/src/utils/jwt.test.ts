import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
});

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = await import("./jwt");

const userId = "8e464d7e-2d95-4c7f-a9ac-3d6f33053085";

describe("JWT utilities", () => {
  test("generates and verifies an access token", () => {
    const token = generateAccessToken(userId);

    expect(verifyAccessToken(token)).toEqual({
      sub: userId,
      tokenType: "access",
    });
  });

  test("generates and verifies a refresh token with a JWT ID", () => {
    const jwtId = crypto.randomUUID();
    const token = generateRefreshToken(userId, jwtId);

    expect(verifyRefreshToken(token)).toEqual({
      sub: userId,
      tokenType: "refresh",
      jti: jwtId,
    });
  });

  test("rejects an expired access token", () => {
    const token = jwt.sign(
      { sub: userId, tokenType: "access" },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: "HS256", expiresIn: -1 },
    );

    expect(() => verifyAccessToken(token)).toThrow("jwt expired");
  });

  test("rejects token-type substitution", () => {
    const refreshToken = generateRefreshToken(userId, crypto.randomUUID());

    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  test("rejects malformed tokens", () => {
    expect(() => verifyAccessToken("not-a-jwt")).toThrow();
  });
});
