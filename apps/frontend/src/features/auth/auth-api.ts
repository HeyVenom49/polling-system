import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@polling-system/shared";
import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/features/auth/AuthContext";

export type AuthSessionPayload = {
  user: AuthUser;
  accessToken: string;
};

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthSessionPayload> {
  return apiRequest<AuthSessionPayload>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function verifyEmail(input: VerifyEmailInput): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/verify-email", {
    method: "POST",
    body: input,
  });
}

export async function resendVerification(
  input: ResendVerificationInput,
): Promise<void> {
  await apiRequest("/auth/resend-verification", {
    method: "POST",
    body: input,
  });
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiRequest("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiRequest("/auth/change-password", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function logoutUser(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}
