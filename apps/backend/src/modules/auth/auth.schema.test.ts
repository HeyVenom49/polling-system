import { describe, expect, test } from "bun:test";
import { loginSchema, registerSchema } from "./auth.schema";

describe("auth schemas", () => {
  test("normalizes registration identity fields", () => {
    const result = registerSchema.parse({
      username: "  Poll_User  ",
      email: "  USER@EXAMPLE.COM  ",
      password: "valid-password",
    });

    expect(result.username).toBe("poll_user");
    expect(result.email).toBe("user@example.com");
  });

  test("rejects unknown registration fields", () => {
    const result = registerSchema.safeParse({
      username: "poll_user",
      email: "user@example.com",
      password: "valid-password",
      role: "admin",
    });

    expect(result.success).toBeFalse();
  });

  test("rejects passwords exceeding bcrypt's 72-byte limit", () => {
    const result = registerSchema.safeParse({
      username: "poll_user",
      email: "user@example.com",
      password: "é".repeat(37),
    });

    expect(result.success).toBeFalse();
  });

  test("accepts normalized email or username login identifiers", () => {
    expect(
      loginSchema.parse({
        identifier: " USER@EXAMPLE.COM ",
        password: "valid-password",
      }).identifier,
    ).toBe("user@example.com");

    expect(
      loginSchema.parse({
        identifier: " Poll_User ",
        password: "valid-password",
      }).identifier,
    ).toBe("poll_user");
  });
});
