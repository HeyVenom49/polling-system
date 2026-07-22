import { apiRequest } from "@/lib/api";
import type { PaginatedPolls } from "@/features/polls/poll-api";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "creator" | "admin";
  plan: "free" | "pro";
  isEmailVerified: boolean;
  createdAt: string;
};

export async function listAllPolls(query: {
  limit?: number;
  offset?: number;
} = {}): Promise<PaginatedPolls> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  return apiRequest<PaginatedPolls>(`/admin/polls${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}

export async function updateUserRole(
  userId: string,
  role: "user" | "creator" | "admin",
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    auth: true,
    body: { role },
  });
}
