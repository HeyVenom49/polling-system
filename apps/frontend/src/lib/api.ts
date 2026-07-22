import type { ApiFailure, ApiSuccess } from "@polling-system/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "ballotly.accessToken";

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      // Rate limits are temporary — keep the existing access token so we
      // don't wipe the session and bounce the user to login.
      if (response.status === 429) {
        const payload = (await response.json().catch(() => null)) as
          | ApiFailure
          | null;
        throw new ApiError(
          payload?.message ?? "Too many requests. Please try again later.",
          429,
        );
      }

      if (!response.ok) {
        setAccessToken(null);
        return null;
      }

      const payload = (await response.json()) as ApiSuccess<{
        accessToken: string;
      }>;

      const token = payload.data?.accessToken ?? null;
      setAccessToken(token);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  { body, auth = false, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const execute = async (): Promise<Response> =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await execute();

  if (response.status === 401 && auth) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      requestHeaders.set("Authorization", `Bearer ${nextToken}`);
      response = await execute();
    }
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && "message" in payload
        ? payload.message
        : `Request failed (${response.status})`;
    const errors =
      payload && payload.success === false ? payload.errors : undefined;
    throw new ApiError(message, response.status, errors);
  }

  return payload.data as T;
}
