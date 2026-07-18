import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import pollRouter from "../modules/polls/poll.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/polls", pollRouter);

export default router;
