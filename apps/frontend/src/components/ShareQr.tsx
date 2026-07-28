import { useMemo } from "react";
import { cn } from "@/lib/utils";

type ShareQrProps = {
  url: string;
  size?: number;
  className?: string;
  label?: string;
};

/** Renders a QR via a public encoder (no local dependency). */
export function ShareQr({
  url,
  size = 168,
  className,
  label = "Scan to open poll",
}: ShareQrProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      size: `${size}x${size}`,
      data: url,
      margin: "8",
    });
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  }, [url, size]);

  return (
    <figure className={cn("inline-flex flex-col items-center gap-2", className)}>
      <img
        src={src}
        alt={`QR code for ${url}`}
        width={size}
        height={size}
        className="rounded-lg border border-border bg-card p-2"
        loading="lazy"
      />
      {label ? (
        <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
      ) : null}
    </figure>
  );
}
