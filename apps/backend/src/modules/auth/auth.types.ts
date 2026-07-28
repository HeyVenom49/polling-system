import type { users } from "../../database/schema";

type UserRecord = typeof users.$inferSelect;

export type PublicUser = Pick<
  UserRecord,
  | "id"
  | "username"
  | "email"
  | "role"
  | "plan"
  | "isEmailVerified"
  | "createdAt"
>;

export type CredentialsUser = PublicUser & Pick<UserRecord, "passwordHash">;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: PublicUser;
  tokens: TokenPair;
};
