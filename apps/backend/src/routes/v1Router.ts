import { Router } from "express";

export type V1RouterDeps = {
  authRouter: Router;
  pollRouter: Router;
  questionRouter: Router;
  optionRouter: Router;
};

export function createV1Router({
  authRouter,
  pollRouter,
  questionRouter,
  optionRouter,
}: V1RouterDeps): Router {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/polls/:pollId/questions/:questionId/options", optionRouter);
  router.use("/polls/:pollId/questions", questionRouter);
  router.use("/polls", pollRouter);

  return router;
}
