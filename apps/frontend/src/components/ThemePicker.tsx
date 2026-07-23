import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  isProPollTheme,
  POLL_THEMES,
  POLL_THEME_IDS,
  type PollThemeId,
  type UserPlan,
} from "@polling-system/shared";
import { inputClassName, textareaClassName } from "@/components/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  value: PollThemeId;
  onChange: (themeId: PollThemeId) => void;
  plan: UserPlan | undefined;
};

export function ThemePicker({ value, onChange, plan }: ThemePickerProps) {
  const isPro = plan === "pro";

  return (
    <fieldset className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <legend className="text-sm font-medium text-foreground">Theme</legend>
        <RequestThemeButton />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {POLL_THEME_IDS.map((id) => {
          const theme = POLL_THEMES[id];
          const locked = isProPollTheme(id) && !isPro;
          const selected = value === id;

          return (
            <button
              key={id}
              type="button"
              disabled={locked}
              className={cn(
                "rounded-lg border p-3 text-left transition-opacity",
                locked ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                selected && !locked
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-border",
              )}
              style={{
                background: theme.cssVars["--poll-bg"],
                color: theme.cssVars["--poll-text"],
              }}
              onClick={() => {
                if (locked) {
                  toast.message("Pro theme", {
                    description: "Upgrade to Pro to use this theme.",
                    action: {
                      label: "Pricing",
                      onClick: () => {
                        window.location.href = "/app/pricing";
                      },
                    },
                  });
                  return;
                }
                onChange(id);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="block font-display font-semibold">
                  {theme.label}
                </span>
                {isProPollTheme(id) ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-primary/90 text-primary-foreground"
                  >
                    Pro
                  </Badge>
                ) : null}
              </div>
              <span
                className="mt-1 block text-xs"
                style={{ color: theme.cssVars["--poll-muted"] }}
              >
                {theme.description}
              </span>
              <span
                className="mt-3 inline-block rounded px-2 py-1 text-xs font-medium"
                style={{
                  background: theme.cssVars["--poll-accent"],
                  color: theme.cssVars["--poll-accent-text"],
                }}
              >
                Accent
              </span>
              {locked ? (
                <p className="mt-2 text-xs font-medium opacity-90">
                  Unlock on{" "}
                  <Link to="/app/pricing" className="underline">
                    Pro
                  </Link>
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RequestThemeButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(
      `Ballotly theme request: ${name.trim() || "Untitled"}`,
    );
    const body = encodeURIComponent(
      `Theme name: ${name.trim()}\n\nNotes:\n${notes.trim()}\n`,
    );
    window.location.href = `mailto:hello@ballotly.app?subject=${subject}&body=${body}`;
    toast.success("Thanks — your mail draft is ready to send.");
    setOpen(false);
    setName("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs">
          Request a theme
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a theme</DialogTitle>
          <DialogDescription>
            Tell us the vibe you want. We’ll review requests for future
            Ballotly themes.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit}>
          <div>
            <label htmlFor="theme-request-name" className="text-sm font-medium">
              Theme name
            </label>
            <input
              id="theme-request-name"
              className={`${inputClassName} mt-1.5`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Forest dusk"
              required
              maxLength={80}
            />
          </div>
          <div>
            <label
              htmlFor="theme-request-notes"
              className="text-sm font-medium"
            >
              Colors / notes
            </label>
            <textarea
              id="theme-request-notes"
              className={`${textareaClassName} mt-1.5`}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Mood, hex colors, dark/light…"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="brand">
              Open email draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProFeatureGateProps = {
  plan: UserPlan | undefined;
  children: ReactNode;
  label: string;
};

export function ProFeatureGate({
  plan,
  children,
  label,
}: ProFeatureGateProps) {
  const isPro = plan === "pro";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="secondary">Pro</Badge>
        {!isPro ? (
          <Link
            to="/app/pricing"
            className="text-xs text-muted-foreground underline"
          >
            Upgrade to unlock
          </Link>
        ) : null}
      </div>
      <div className={cn(!isPro && "pointer-events-none opacity-55")}>
        {children}
      </div>
    </div>
  );
}
