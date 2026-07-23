import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { label: "Ocean teal", target: 62 },
  { label: "Midnight", target: 24 },
  { label: "Sunset", target: 14 },
] as const;

type PollPreviewProps = {
  className?: string;
  /** Softer treatment for hero background */
  ambient?: boolean;
};

/** Decorative live-results mock — CSS bars, no real data. */
export function PollPreview({ className, ambient = false }: PollPreviewProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }
    const id = window.setTimeout(() => setActive(true), ambient ? 200 : 80);
    return () => window.clearTimeout(id);
  }, [ambient]);

  return (
    <div
      className={cn(
        "select-none",
        ambient
          ? "pointer-events-none opacity-90"
          : "rounded-2xl border border-border/70 bg-card/90 p-6 shadow-none",
        className,
      )}
      aria-hidden
    >
      {!ambient ? (
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Live poll
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-foreground">
              Which theme feels right?
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            Live
          </span>
        </div>
      ) : null}

      <ul className={cn("space-y-4", ambient && "space-y-5")}>
        {OPTIONS.map((option) => (
          <li key={option.label}>
            <div className="mb-1.5 flex justify-between gap-3 text-sm">
              <span
                className={cn(
                  ambient ? "text-foreground/80" : "text-foreground",
                )}
              >
                {option.label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {active ? `${option.target}%` : "0%"}
              </span>
            </div>
            <div
              className={cn(
                "h-2.5 overflow-hidden rounded-full",
                ambient ? "bg-foreground/10" : "bg-muted",
              )}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: active ? `${option.target}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ul>

      {!ambient ? (
        <p className="mt-5 text-xs text-muted-foreground">
          128 responses · updating as votes arrive
        </p>
      ) : null}
    </div>
  );
}
