import { describe, expect, mock, test } from "bun:test";
import bcrypt from "bcrypt";
import type { AuthRepository } from "./auth.repository";
import type { AuthSessionRepository } from "./auth-session.repository";
import type { CredentialsUser, PublicUser } from "./auth.types";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
});

const { AuthService } = await import("./auth.service");
const { generateRefreshToken, verifyRefreshToken } =
  await import("../../utils/jwt");

const publicUser: PublicUser = {
  id: "8e464d7e-2d95-4c7f-a9ac-3d6f33053085",
  username: "pollster",
  email: "pollster@example.com",
  role: "user",
  isEmailVerified: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

async function createHarness(credentialsUser: CredentialsUser | null) {
  const repository = {
    existsByEmail: mock(async () => false),
    existsByUsername: mock(async () => false),
    findCredentialsByIdentifier: mock(async () => credentialsUser),
    findById: mock(async (): Promise<PublicUser | null> => publicUser),
    createUser: mock(async () => publicUser),
  };
  const sessionRepository = {
    create: mock(async () => undefined),
    consume: mock(async () => publicUser.id),
    delete: mock(async () => undefined),
  };
  const service = new AuthService(
    repository as unknown as AuthRepository,
    sessionRepository as unknown as AuthSessionRepository,
  );

  return { repository, sessionRepository, service };
}

describe("AuthService", () => {
  test("registers a unique user", async () => {
    const { repository, service } = await createHarness(null);

    const result = await service.register({
      username: publicUser.username,
      email: publicUser.email,
      password: "correct-password",
    });

    expect(result).toEqual(publicUser);
    expect(repository.createUser).toHaveBeenCalledTimes(1);
  });

  test("rejects duplicate registration data", async () => {
    const { repository, service } = await createHarness(null);
    repository.existsByEmail.mockResolvedValueOnce(true);

    await expect(
      service.register({
        username: publicUser.username,
        email: publicUser.email,
        password: "correct-password",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("logs in and persists a refresh session", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 10);
    const { sessionRepository, service } = await createHarness({
      ...publicUser,
      passwordHash,
    });

    const result = await service.login({
      identifier: publicUser.email,
      password: "correct-password",
    });
    const refreshPayload = verifyRefreshToken(result.tokens.refreshToken);

    expect(result.user).toEqual(publicUser);
    expect(result.tokens.accessToken).toBeString();
    expect(sessionRepository.create).toHaveBeenCalledWith(
      refreshPayload.jti,
      publicUser.id,
      604_800,
    );
  });

  test("uses a generic unauthorized error for invalid credentials", async () => {
    const { service } = await createHarness(null);

    await expect(
      service.login({
        identifier: "missing@example.com",
        password: "incorrect-password",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid credentials",
    });
  });

  test("rotates a consumed refresh session", async () => {
    const oldJwtId = crypto.randomUUID();
    const oldRefreshToken = generateRefreshToken(publicUser.id, oldJwtId);
    const { sessionRepository, service } = await createHarness(null);

    const result = await service.refresh(oldRefreshToken);
    const newPayload = verifyRefreshToken(result.tokens.refreshToken);

    expect(sessionRepository.consume).toHaveBeenCalledWith(oldJwtId);
    expect(newPayload.jti).not.toBe(oldJwtId);
    expect(sessionRepository.create).toHaveBeenCalledTimes(1);
  });

  test("rejects missing, inactive, or deleted refresh users", async () => {
    const jwtId = crypto.randomUUID();
    const refreshToken = generateRefreshToken(publicUser.id, jwtId);
    const { repository, service } = await createHarness(null);
    repository.findById.mockResolvedValueOnce(null);

    await expect(service.refresh(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid or expired refresh token",
    });
  });

  test("invalidates the refresh session on logout", async () => {
    const jwtId = crypto.randomUUID();
    const refreshToken = generateRefreshToken(publicUser.id, jwtId);
    const { sessionRepository, service } = await createHarness(null);

    await service.logout(refreshToken);

    expect(sessionRepository.delete).toHaveBeenCalledWith(jwtId);
  });
});
