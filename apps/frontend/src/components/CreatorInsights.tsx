import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PollResultsPanel } from "@/components/PollResultsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/features/auth/form-utils";
import type { Poll } from "@/features/polls/poll-api";
import {
  getPollAnalytics,
  getPollResults,
  type PollResults,
} from "@/features/polls/public-poll-api";
import { usePollSocket } from "@/features/polls/usePollSocket";

type CreatorInsightsProps = {
  poll: Poll;
};

export function CreatorInsights({ poll }: CreatorInsightsProps) {
  const queryClient = useQueryClient();
  const [liveResults, setLiveResults] = useState<PollResults | null>(null);
  const [totalResponses, setTotalResponses] = useState<number | null>(null);

  const analyticsQuery = useQuery({
    queryKey: ["poll", poll.id, "analytics"],
    queryFn: () => getPollAnalytics(poll.id),
  });

  const resultsQuery = useQuery({
    queryKey: ["poll", poll.id, "results"],
    queryFn: () => getPollResults(poll.id),
  });

  usePollSocket({
    pollId: poll.id,
    enabled: true,
    onResultsUpdated: (results) => {
      setLiveResults(results);
      setTotalResponses(results.totalResponses);
      queryClient.setQueryData(["poll", poll.id, "results"], results);
      void queryClient.invalidateQueries({
        queryKey: ["poll", poll.id, "analytics"],
      });
    },
    onResponseSubmitted: (payload) => {
      setTotalResponses(payload.totalResponses);
      void queryClient.invalidateQueries({
        queryKey: ["poll", poll.id, "analytics"],
      });
    },
  });

  const results =
    liveResults ?? resultsQuery.data ?? analyticsQuery.data?.results ?? null;
  const analytics = analyticsQuery.data;
  const displayTotal =
    totalResponses ??
    analytics?.totalResponses ??
    results?.totalResponses ??
    0;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/90 p-5 text-foreground">
      <div>
        <h2 className="font-display text-xl font-semibold">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live for you as the creator
          {poll.resultPublished ? "" : " (unpublished to voters)"}.
        </p>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : null}

      {analyticsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(analyticsQuery.error, "Failed to load analytics")}
        </p>
      ) : null}

      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total responses" value={String(displayTotal)} />
          <Stat label="Guests" value={String(analytics.guestResponses)} />
          <Stat
            label="Signed-in"
            value={String(analytics.authenticatedResponses)}
          />
        </div>
      ) : null}

      {analytics && analytics.responsesByDay.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Responses by day</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {analytics.responsesByDay.map((day) => (
              <li key={day.date} className="flex justify-between gap-4">
                <span>{day.date}</span>
                <span>{day.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analytics && analytics.recentResponses.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Recent responses</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {analytics.recentResponses.map((row) => (
              <li key={row.id} className="flex justify-between gap-4">
                <span>{row.identityType === "guest" ? "Guest" : "User"}</span>
                <span>{new Date(row.submittedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {results ? (
        <div className="border-t border-border/70 pt-4">
          <PollResultsPanel
            results={{ ...results, totalResponses: displayTotal }}
            live
            usePollTheme={false}
          />
        </div>
      ) : resultsQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <p className="text-sm text-muted-foreground">No responses yet.</p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
