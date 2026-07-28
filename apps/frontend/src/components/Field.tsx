import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
};

export function Field({ id, label, error, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
  "outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--placeholder)] placeholder:opacity-100",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
  "dark:bg-card dark:[color-scheme:dark]",
);

export const textareaClassName = cn(
  inputClassName,
  "min-h-[6.5rem] h-auto resize-y leading-relaxed",
);

export const primaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
  "transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60",
);

export const secondaryButtonClassName = cn(
  "inline-flex w-full items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground",
  "transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
);
