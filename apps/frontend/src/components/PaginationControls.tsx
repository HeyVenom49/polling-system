import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  className?: string;
  disabled?: boolean;
};

export function PaginationControls({
  total,
  limit,
  offset,
  onChange,
  className,
  disabled,
}: PaginationControlsProps) {
  if (total <= limit) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Showing {total} of {total}
      </p>
    );
  }

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canPrev}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canNext}
          onClick={() => onChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
