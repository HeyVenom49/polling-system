import { useState } from "react";
import { Navigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import {
  listAllPolls,
  updateUserRole,
} from "@/features/admin/admin-api";
import { sharePollUrl } from "@/features/polls/poll-api";

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [roleUserId, setRoleUserId] = useState("");
  const [role, setRole] = useState<"user" | "creator" | "admin">("user");
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const pollsQuery = useQuery({
    queryKey: ["admin", "polls"],
    queryFn: () => listAllPolls({ limit: 50, offset: 0 }),
    enabled: user?.role === "admin",
  });

  const roleMutation = useMutation({
    mutationFn: () => updateUserRole(roleUserId.trim(), role),
    onSuccess: (updated) => {
      setRoleMessage(
        `Updated ${updated.username} (${updated.email}) → ${updated.role}`,
      );
      setRoleError(null);
    },
    onError: (error) => {
      setRoleMessage(null);
      setRoleError(getErrorMessage(error, "Could not update role"));
    },
  });

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Manage roles and inspect all polls.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-card/90 p-5">
        <h2 className="font-display text-xl font-semibold">Set user role</h2>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setRoleMessage(null);
            setRoleError(null);
            roleMutation.mutate();
          }}
        >
          <Field id="user-id" label="User ID (UUID)" hint="From the users table or support request.">
            <input
              id="user-id"
              className={inputClassName}
              value={roleUserId}
              onChange={(event) => setRoleUserId(event.target.value)}
              required
              pattern="[0-9a-fA-F-]{36}"
            />
          </Field>
          <Field id="role" label="Role">
            <select
              id="role"
              className={inputClassName}
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "user" | "creator" | "admin")
              }
            >
              <option value="user">user</option>
              <option value="creator">creator</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          {roleError ? (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {roleError}
            </p>
          ) : null}
          {roleMessage ? (
            <p className="text-sm text-[var(--color-muted)]">{roleMessage}</p>
          ) : null}
          <button
            type="submit"
            className={`${primaryButtonClassName} w-auto`}
            disabled={roleMutation.isPending || !roleUserId.trim()}
          >
            {roleMutation.isPending ? "Updating…" : "Update role"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">All polls</h2>
          <button
            type="button"
            className="text-sm underline"
            onClick={() =>
              void queryClient.invalidateQueries({ queryKey: ["admin", "polls"] })
            }
          >
            Refresh
          </button>
        </div>

        {pollsQuery.isLoading ? (
          <p className="text-[var(--color-muted)]">Loading polls…</p>
        ) : null}

        {pollsQuery.isError ? (
          <p className="text-[var(--color-danger)]" role="alert">
            {getErrorMessage(pollsQuery.error, "Failed to load polls")}
          </p>
        ) : null}

        {pollsQuery.data ? (
          <ul className="space-y-3">
            {pollsQuery.data.items.map((poll) => (
              <li
                key={poll.id}
                className="rounded-xl border border-[var(--color-border)] bg-card/90 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {poll.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {poll.status}
                      {poll.resultPublished ? " · results live" : ""} · creator{" "}
                      <span className="font-mono">{poll.creatorId.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <a
                    href={sharePollUrl(poll.shareId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    Open form
                  </a>
                </div>
              </li>
            ))}
            {pollsQuery.data.items.length === 0 ? (
              <p className="text-[var(--color-muted)]">No polls yet.</p>
            ) : null}
            <p className="text-xs text-[var(--color-muted)]">
              Showing {pollsQuery.data.items.length} of {pollsQuery.data.total}
            </p>
          </ul>
        ) : null}
      </section>
    </div>
  );
}
