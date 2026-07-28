/** Drizzle wraps driver errors: real Postgres `code` lives on `error.cause`. */
export function getPostgresErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return null;
    }

    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }

    current = "cause" in current ? current.cause : null;
  }

  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === "23505";
}

export function isForeignKeyViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === "23503";
}

export function getPostgresConstraint(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return null;
    }

    if ("constraint" in current && typeof current.constraint === "string") {
      return current.constraint;
    }

    current = "cause" in current ? current.cause : null;
  }

  return null;
}
