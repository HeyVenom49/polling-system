import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express-serve-static-core";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/validation.error";

function createValidator(
  getValue: (req: Request) => unknown,
  setValue: (req: Request, data: unknown) => void,
): (schema: ZodType) => RequestHandler {
  return (schema: ZodType): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(getValue(req));

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

      setValue(req, result.data);
      next();
    };
  };
}

export const validateBody = createValidator(
  (req) => req.body,
  (req, data) => {
    req.body = data;
  },
);

export const validateParams = createValidator(
  (req) => req.params,
  (req, data) => {
    Object.assign(req.params, data);
  },
);
