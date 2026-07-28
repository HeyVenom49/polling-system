import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Field,
  inputClassName,
  primaryButtonClassName,
} from "@/components/Field";
import { PaginationControls } from "@/components/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/features/auth/form-utils";
import {
  listAllPolls,
  searchUsers,
  updateUserPlan,
  updateUserRole,
  type AdminUser,
} from "@/features/admin/admin-api";
import { sharePollUrl } from "@/features/polls/poll-api";

const POLLS_PAGE_SIZE = 10;

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pollOffset, setPollOffset] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<"user" | "creator" | "admin">("user");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const pollsQuery = useQuery({
    queryKey: ["admin", "polls", POLLS_PAGE_SIZE, pollOffset],
    queryFn: () => listAllPolls({ limit: POLLS_PAGE_SIZE, offset: pollOffset }),
    enabled: user?.role === "admin",
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", searchQuery],
    queryFn: () => searchUsers({ q: searchQuery, limit: 20, offset: 0 }),
    enabled: user?.role === "admin" && searchQuery.trim().length > 0,
  });

  const roleMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) {
        throw new Error("Select a user first");
      }
      return updateUserRole(selectedUser.id, role);
    },
    onSuccess: (updated) => {
      setSelectedUser(updated);
      setPlan(updated.plan);
      setUserMessage(
        `Updated ${updated.username} role → ${updated.role}`,
      );
      setUserError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      setUserMessage(null);
      setUserError(getErrorMessage(error, "Could not update role"));
    },
  });

  const planMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) {
        throw new Error("Select a user first");
      }
      return updateUserPlan(selectedUser.id, plan);
    },
    onSuccess: (updated) => {
      setSelectedUser(updated);
      setRole(updated.role);
      setUserMessage(
        `Updated ${updated.username} plan → ${updated.plan}`,
      );
      setUserError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      setUserMessage(null);
      setUserError(getErrorMessage(error, "Could not update plan"));
    },
  });

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Search users by email or username, then manage roles, plans, and
          inspect polls.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card/90 p-5">
        <h2 className="font-display text-xl font-semibold">Find user</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchQuery(searchInput.trim());
            setSelectedUser(null);
            setUserMessage(null);
            setUserError(null);
          }}
        >
          <input
            className={`${inputClassName} min-w-[220px] flex-1`}
            placeholder="Email or username"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className={`${primaryButtonClassName} w-auto`}>
            Search
          </button>
        </form>

        {usersQuery.isFetching ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : null}

        {usersQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(usersQuery.error, "Search failed")}
          </p>
        ) : null}

        {usersQuery.data && usersQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users matched.</p>
        ) : null}

        {usersQuery.data && usersQuery.data.items.length > 0 ? (
          <ul className="space-y-2">
            {usersQuery.data.items.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedUser?.id === row.id
                      ? "border-brand bg-accent"
                      : "border-border hover:bg-muted/60"
                  }`}
                  onClick={() => {
                    setSelectedUser(row);
                    setRole(row.role);
                    setPlan(row.plan);
                    setUserMessage(null);
                    setUserError(null);
                  }}
                >
                  <span className="font-medium">{row.username}</span>
                  <span className="text-muted-foreground"> · {row.email}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {row.role} · {row.plan}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selectedUser ? (
          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm">
              Selected{" "}
              <span className="font-medium">{selectedUser.username}</span> (
              {selectedUser.email})
            </p>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setUserMessage(null);
                setUserError(null);
                roleMutation.mutate();
              }}
            >
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
              <button
                type="submit"
                className={`${primaryButtonClassName} w-auto`}
                disabled={roleMutation.isPending}
              >
                {roleMutation.isPending ? "Updating…" : "Update role"}
              </button>
            </form>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setUserMessage(null);
                setUserError(null);
                planMutation.mutate();
              }}
            >
              <Field id="plan" label="Plan">
                <select
                  id="plan"
                  className={inputClassName}
                  value={plan}
                  onChange={(event) =>
                    setPlan(event.target.value as "free" | "pro")
                  }
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
              </Field>
              <button
                type="submit"
                className={`${primaryButtonClassName} w-auto`}
                disabled={planMutation.isPending}
              >
                {planMutation.isPending ? "Updating…" : "Update plan"}
              </button>
            </form>

            {userError ? (
              <p className="text-sm text-destructive" role="alert">
                {userError}
              </p>
            ) : null}
            {userMessage ? (
              <p className="text-sm text-muted-foreground">{userMessage}</p>
            ) : null}
          </div>
        ) : null}
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
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : null}

        {pollsQuery.isError ? (
          <p className="text-destructive" role="alert">
            {getErrorMessage(pollsQuery.error, "Failed to load polls")}
          </p>
        ) : null}

        {pollsQuery.data && pollsQuery.data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
            No polls in the system yet.
          </div>
        ) : null}

        {pollsQuery.data && pollsQuery.data.items.length > 0 ? (
          <>
            <ul className="space-y-3">
              {pollsQuery.data.items.map((poll) => (
                <li
                  key={poll.id}
                  className="rounded-xl border border-border bg-card/90 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">
                        {poll.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {poll.status}
                        {poll.resultPublished ? " · results live" : ""} · creator{" "}
                        <span className="font-mono">
                          {poll.creatorId.slice(0, 8)}…
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Link
                        to={`/app/polls/${poll.id}`}
                        className="underline"
                      >
                        Manage
                      </Link>
                      <a
                        href={sharePollUrl(poll.shareId)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Open form
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <PaginationControls
              total={pollsQuery.data.total}
              limit={POLLS_PAGE_SIZE}
              offset={pollOffset}
              disabled={pollsQuery.isFetching}
              onChange={setPollOffset}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}
