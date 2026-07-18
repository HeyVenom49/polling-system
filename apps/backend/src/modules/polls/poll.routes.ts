import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { createPollSchema, updatePollSchema } from "./poll.schema";
import { pollController } from "./poll.controller";

const pollRouter = Router();

pollRouter.post(
  "/",
  authenticate,
  validateBody(createPollSchema),
  pollController.create,
);

pollRouter.get("/", authenticate, pollController.listMine);

pollRouter.get("/share/:shareId", pollController.getByShareId);

pollRouter.get("/:id", pollController.getById);

pollRouter.patch(
  "/:id",
  authenticate,
  validateBody(updatePollSchema),
  pollController.update,
);

pollRouter.delete("/:id", authenticate, pollController.delete);

export default pollRouter;
