import { ApiError } from "@/lib/api";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function fieldError(
  errors: Record<string, { message?: string } | undefined>,
  name: string,
): string | undefined {
  return errors[name]?.message;
}
