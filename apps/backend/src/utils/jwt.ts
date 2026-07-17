import jwt, { JsonWebTokenError, type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type TokenType = "access" | "refresh";

type BaseTokenPayload = {
  sub: string;
  tokenType: TokenType;
};

const tokenConfig = {
  access: {
    secret: env.JWT_ACCESS_SECRET,
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  },
  refresh: {
    secret: env.JWT_REFRESH_SECRET,
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },
} as const;

export type AccessTokenPayload = BaseTokenPayload & {
  tokenType: "access";
};

export type RefreshTokenPayload = BaseTokenPayload & {
  tokenType: "refresh";
  jti: string;
};

function parseTokenPayload(
  decoded: JwtPayload | string,
  expectedType: "access",
): AccessTokenPayload;
function parseTokenPayload(
  decoded: JwtPayload | string,
  expectedType: "refresh",
): RefreshTokenPayload;
function parseTokenPayload(
  decoded: JwtPayload | string,
  expectedType: TokenType,
): AccessTokenPayload | RefreshTokenPayload {
  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    decoded.tokenType !== expectedType
  ) {
    throw new JsonWebTokenError("Invalid token payload");
  }

  if (expectedType === "refresh") {
    if (typeof decoded.jti !== "string") {
      throw new JsonWebTokenError("Invalid refresh token payload");
    }

    return {
      sub: decoded.sub,
      tokenType: "refresh",
      jti: decoded.jti,
    };
  }

  return { sub: decoded.sub, tokenType: "access" };
}

function signToken(type: "access", userId: string): string;
function signToken(type: "refresh", userId: string, jwtId: string): string;
function signToken(type: TokenType, userId: string, jwtId?: string): string {
  const { secret, expiresIn } = tokenConfig[type];
  const payload =
    type === "refresh"
      ? { sub: userId, tokenType: type, jti: jwtId }
      : { sub: userId, tokenType: type };

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn,
  });
}

function verifyToken(type: "access", token: string): AccessTokenPayload;
function verifyToken(type: "refresh", token: string): RefreshTokenPayload;
function verifyToken(
  type: TokenType,
  token: string,
): AccessTokenPayload | RefreshTokenPayload {
  const decoded = jwt.verify(token, tokenConfig[type].secret, {
    algorithms: ["HS256"],
  });

  return type === "access"
    ? parseTokenPayload(decoded, "access")
    : parseTokenPayload(decoded, "refresh");
}

const generateAccessToken = (userId: string): string =>
  signToken("access", userId);

const verifyAccessToken = (token: string): AccessTokenPayload =>
  verifyToken("access", token);

const generateRefreshToken = (userId: string, jwtId: string): string =>
  signToken("refresh", userId, jwtId);

const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  verifyToken("refresh", token);

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
