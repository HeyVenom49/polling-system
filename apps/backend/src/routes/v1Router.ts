import { Router } from "express";

export type V1RouterDeps = {
  authRouter: Router;
  pollRouter: Router;
};

export function createV1Router({
  authRouter,
  pollRouter,
}: V1RouterDeps): Router {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/polls", pollRouter);

  return router;
}
