import { Router } from "express";

export type V1RouterDeps = {
  authRouter: Router;
  pollRouter: Router;
  questionRouter: Router;
  optionRouter: Router;
  responseRouter: Router;
  resultRouter: Router;
};

export function createV1Router({
  authRouter,
  pollRouter,
  questionRouter,
  optionRouter,
  responseRouter,
  resultRouter,
}: V1RouterDeps): Router {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/polls/:pollId/questions/:questionId/options", optionRouter);
  router.use("/polls/:pollId/questions", questionRouter);
  router.use("/polls/:pollId/responses", responseRouter);
  router.use("/polls/:pollId/results", resultRouter);
  router.use("/polls", pollRouter);

  return router;
}
