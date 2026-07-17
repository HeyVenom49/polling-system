import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express-serve-static-core";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/validation.error";

export const validateBody = (schema: ZodType): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new ValidationError(
          result.error.issues.map((issue) => {
            const detail: {
              code: typeof issue.code;
              message: string;
              path: typeof issue.path;
              expected?: unknown;
              received?: unknown;
            } = {
              code: issue.code,
              message: issue.message,
              path: issue.path,
            };

            if ("expected" in issue) {
              detail.expected = issue.expected;
            }

            if ("received" in issue) {
              detail.received = issue.received;
            }

            return detail;
          }),
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
};
