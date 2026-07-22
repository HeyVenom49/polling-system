import { Link } from "react-router";
import { BRAND_NAME } from "@polling-system/shared";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "lg";
};

export function BrandMark({ className = "", size = "sm" }: BrandMarkProps) {
  const textClass = size === "lg" ? "text-4xl md:text-6xl" : "text-xl";

  return (
    <Link
      to="/"
      className={`font-display font-bold tracking-tight text-foreground ${textClass} ${className}`}
    >
      {BRAND_NAME}
    </Link>
  );
}
