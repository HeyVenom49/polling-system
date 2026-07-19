import { Router } from "express";

export type V1RouterDeps = {
  authRouter: Router;
  pollRouter: Router;
  questionRouter: Router;
};

export function createV1Router({
  authRouter,
  pollRouter,
  questionRouter,
}: V1RouterDeps): Router {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/polls/:pollId/questions", questionRouter);
  router.use("/polls", pollRouter);

  return router;
}
