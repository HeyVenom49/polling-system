import { Router } from "express";

export function createApiRouter(v1Router: Router): Router {
  const router = Router();
  router.use("/v1", v1Router);
  return router;
}
