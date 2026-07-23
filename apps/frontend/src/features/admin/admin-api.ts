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

export type PaginatedUsers = {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
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

export async function searchUsers(query: {
  q: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedUsers> {
  const params = new URLSearchParams();
  params.set("q", query.q);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  return apiRequest<PaginatedUsers>(`/admin/users?${params.toString()}`, {
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

export async function updateUserPlan(
  userId: string,
  plan: "free" | "pro",
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}/plan`, {
    method: "PATCH",
    auth: true,
    body: { plan },
  });
}
