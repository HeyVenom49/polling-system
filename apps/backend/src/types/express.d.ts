import type { PublicUser } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      guestId?: string;
    }
  }
}

export {};
