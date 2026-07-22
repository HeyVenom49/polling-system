import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlanUsage, UserPlan } from "@polling-system/shared";
import { ApiError, apiRequest, getAccessToken, setAccessToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "creator" | "admin";
  plan: UserPlan;
  isEmailVerified: boolean;
  createdAt: string;
} & Partial<PlanUsage>;

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback((nextUser: AuthUser, accessToken: string) => {
    setAccessToken(accessToken);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }

    const me = await apiRequest<AuthUser>("/auth/me", { auth: true });
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getAccessToken()) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        // Don't treat temporary rate limits as a logout.
        if (error instanceof ApiError && error.status === 429) {
          return;
        }
        clearSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      setSession,
      clearSession,
      refreshUser,
    }),
    [user, isLoading, setSession, clearSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
