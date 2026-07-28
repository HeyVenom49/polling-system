import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FREE_DAILY_POLL_LIMIT, POLL_THEMES } from "@polling-system/shared";
import { PageShell, Reveal } from "@/components/motion";
import { PaginationControls } from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import {
  deletePoll,
  listMyPolls,
  sharePollUrl,
  updatePoll,
  type Poll,
} from "@/features/polls/poll-api";
import { getErrorMessage } from "@/features/auth/form-utils";
import { useState } from "react";

const PAGE_SIZE = 10;

function StatusBadge({ poll }: { poll: Poll }) {
  return (
    <Badge variant={poll.status === "open" ? "default" : "secondary"}>
      {poll.status === "open" ? "Open" : "Closed"}
      {poll.resultPublished ? " · Results live" : ""}
    </Badge>
  );
}

export function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const pollsQuery = useQuery({
    queryKey: ["polls", "mine", PAGE_SIZE, offset],
    queryFn: () => listMyPolls({ limit: PAGE_SIZE, offset }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["polls", "mine"] });
      await refreshUser();
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Parameters<typeof updatePoll>[1]) =>
      updatePoll(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["polls", "mine"] });
    },
  });

  const limitLabel =
    user?.dailyLimit == null
      ? "Unlimited creates"
      : `${user.pollsCreatedToday ?? 0} / ${user.dailyLimit ?? FREE_DAILY_POLL_LIMIT} creates today`;

  async function copyShareLink(poll: Poll) {
    try {
      await navigator.clipboard.writeText(sharePollUrl(poll.shareId));
      setCopiedId(poll.id);
      toast.success("Link copied");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      setActionError(getErrorMessage(error, "Could not copy link"));
    }
  }

  return (
    <PageShell className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your polls</h1>
          <p className="mt-2 text-muted-foreground">{limitLabel}</p>
        </div>
        <Button asChild variant="brand" className="interactive-press">
          <Link to="/app/polls/new">Create poll</Link>
        </Button>
      </div>

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {pollsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : null}

      {pollsQuery.isError ? (
        <p className="text-destructive" role="alert">
          {getErrorMessage(pollsQuery.error, "Failed to load polls")}
        </p>
      ) : null}

      {pollsQuery.data && pollsQuery.data.items.length === 0 && offset === 0 ? (
        <Reveal>
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold">No polls yet</p>
            <p className="mt-2 text-muted-foreground">
              Create your first poll
              {user ? `, ${user.username}` : ""}, then share the link.
            </p>
            <Button asChild variant="brand" className="mt-4 interactive-press">
              <Link to="/app/polls/new">Create a poll</Link>
            </Button>
          </div>
        </Reveal>
      ) : null}

      {pollsQuery.data && pollsQuery.data.items.length > 0 ? (
        <>
          <ul className="space-y-3">
            {pollsQuery.data.items.map((poll, index) => {
              const theme = POLL_THEMES[poll.themeId];
              return (
                <Reveal key={poll.id} delayMs={Math.min(index * 50, 200)}>
                  <li className="interactive-press rounded-xl border border-border/70 bg-card/90 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-xl font-semibold">
                            {poll.title}
                          </h2>
                          <StatusBadge poll={poll} />
                        </div>
                        {poll.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {poll.description}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Theme: {theme.label} · Updated{" "}
                          {new Date(poll.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link to={`/app/polls/${poll.id}`}>Manage</Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void copyShareLink(poll)}
                        >
                          {copiedId === poll.id ? "Copied" : "Copy link"}
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={sharePollUrl(poll.shareId)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4 text-sm">
                      <button
                        type="button"
                        className="text-foreground underline disabled:opacity-50"
                        disabled={patchMutation.isPending}
                        onClick={() => {
                          setActionError(null);
                          patchMutation.mutate(
                            {
                              id: poll.id,
                              status:
                                poll.status === "open" ? "closed" : "open",
                            },
                            {
                              onError: (error) =>
                                setActionError(
                                  getErrorMessage(
                                    error,
                                    "Could not update status",
                                  ),
                                ),
                              onSuccess: () =>
                                toast.success(
                                  poll.status === "open"
                                    ? "Poll closed"
                                    : "Poll reopened",
                                ),
                            },
                          );
                        }}
                      >
                        {poll.status === "open" ? "Close poll" : "Reopen poll"}
                      </button>
                      <button
                        type="button"
                        className="text-foreground underline disabled:opacity-50"
                        disabled={patchMutation.isPending}
                        onClick={() => {
                          setActionError(null);
                          patchMutation.mutate(
                            {
                              id: poll.id,
                              resultPublished: !poll.resultPublished,
                            },
                            {
                              onError: (error) =>
                                setActionError(
                                  getErrorMessage(
                                    error,
                                    "Could not update results visibility",
                                  ),
                                ),
                              onSuccess: () =>
                                toast.success(
                                  poll.resultPublished
                                    ? "Results unpublished"
                                    : "Results published",
                                ),
                            },
                          );
                        }}
                      >
                        {poll.resultPublished
                          ? "Unpublish results"
                          : "Publish results"}
                      </button>
                      <button
                        type="button"
                        className="text-destructive underline disabled:opacity-50"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete “${poll.title}”? This cannot be undone.`,
                            )
                          ) {
                            return;
                          }
                          setActionError(null);
                          deleteMutation.mutate(poll.id, {
                            onError: (error) =>
                              setActionError(
                                getErrorMessage(error, "Could not delete poll"),
                              ),
                            onSuccess: () => toast.success("Poll deleted"),
                          });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>
          <PaginationControls
            total={pollsQuery.data.total}
            limit={PAGE_SIZE}
            offset={offset}
            disabled={pollsQuery.isFetching}
            onChange={setOffset}
          />
        </>
      ) : null}
    </PageShell>
  );
}
