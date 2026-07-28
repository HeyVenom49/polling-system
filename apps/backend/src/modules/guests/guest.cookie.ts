import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env";

const GUEST_COOKIE_NAME = "guestId";
const GUEST_COOKIE_PATH = "/api/v1";
const GUEST_COOKIE_TTL_MS = 30 * 4 * 60 * 60 * 1000;

/**
 * Cross-origin deploys (e.g. Vercel FE + Render API) need SameSite=None; Secure.
 * Same-site local/dev keeps Strict.
 */
function guestCookieOption(): CookieOptions {
  const crossSite = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? "none" : "strict",
    path: GUEST_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function readGuestIdCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[GUEST_COOKIE_NAME];

  return typeof value === "string" ? value : undefined;
}

export function setGuestIdCookie(res: Response, guestId: string): void {
  res.cookie(GUEST_COOKIE_NAME, guestId, {
    ...guestCookieOption(),
    maxAge: GUEST_COOKIE_TTL_MS,
  });
}
