import { z } from "zod";
import type { GuestService } from "../modules/guests/guest.service";
import type { RequestHandler } from "express";
import {
  readGuestIdCookie,
  setGuestIdCookie,
} from "../modules/guests/guest.cookie";
import { NotFoundError } from "../errors/not-found.error";

const guestIdSchema = z.uuid();

export function createResolveGuest(guestService: GuestService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (req.user) {
        next();
        return;
      }
      const cookieGuestId = readGuestIdCookie(req);
      const parsedGuestId = guestIdSchema.safeParse(cookieGuestId);
      if (parsedGuestId.success) {
        try {
          const guest = await guestService.findById(parsedGuestId.data);
          req.guestId = guest.id;
          next();
          return;
        } catch (error) {
          if (!(error instanceof NotFoundError)) {
            throw error;
          }
        }
      }
      const guest = await guestService.createGuest();
      setGuestIdCookie(res, guest.id);
      req.guestId = guest.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
