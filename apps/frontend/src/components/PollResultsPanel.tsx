import type { CSSProperties } from "react";
import type { PollResults } from "@/features/polls/public-poll-api";

type PollResultsPanelProps = {
  results: PollResults;
  live?: boolean;
  /** When false, use app theme colors instead of poll CSS variables. */
  usePollTheme?: boolean;
};

export function PollResultsPanel({
  results,
  live = false,
  usePollTheme = true,
}: PollResultsPanelProps) {
  const text = usePollTheme ? "var(--poll-text)" : "var(--color-text)";
  const muted = usePollTheme ? "var(--poll-muted)" : "var(--color-muted)";
  const border = usePollTheme ? "var(--poll-border)" : "var(--color-border)";
  const accent = usePollTheme ? "var(--poll-accent)" : "var(--color-accent)";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="font-display text-2xl font-semibold"
          style={{ color: text }}
        >
          Results
        </h2>
        <p className="text-sm" style={{ color: muted }}>
          {results.totalResponses} response
          {results.totalResponses === 1 ? "" : "s"}
          {live ? " · Live" : ""}
        </p>
      </div>

      <ul className="space-y-6">
        {results.questions.map((question) => (
          <li key={question.id} className="space-y-3">
            <h3
              className="font-display text-lg font-semibold"
              style={{ color: text }}
            >
              {question.title}
            </h3>
            <ul className="space-y-2">
              {question.options.map((option) => (
                <li key={option.id} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span style={{ color: text }}>{option.value}</span>
                    <span style={{ color: muted }}>
                      {option.count} · {option.percentage}%
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: border }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={
                        {
                          width: `${option.percentage}%`,
                          background: accent,
                        } as CSSProperties
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
