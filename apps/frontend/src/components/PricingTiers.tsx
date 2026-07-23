import { FREE_DAILY_POLL_LIMIT } from "@polling-system/shared";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BUSINESS_MAIL =
  "mailto:hello@ballotly.app?subject=Ballotly%20Business%20plan";

export type PricingPlanId = "free" | "pro" | "max" | "business";

export type PricingTiersProps = {
  currentPlan?: "free" | "pro";
  /** Landing uses register CTAs; app uses dashboard/back links. */
  context: "marketing" | "app";
  className?: string;
};

type Tier = {
  id: PricingPlanId;
  name: string;
  price: string;
  priceNote: string;
  blurb: string;
  featured?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "per month",
    blurb: "For trying live quizzes and casual open polls.",
    features: [
      `${FREE_DAILY_POLL_LIMIT} creates per day (UTC)`,
      "Live quizzes & open polls",
      "6 core themes",
      "Guest voting on open polls",
      "Live results & basic insights",
      "Generate with AI — not included",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    priceNote: "per month · billed monthly",
    blurb: "For hosts who run quizzes often and need full controls.",
    features: [
      "Unlimited creates",
      "All 11 themes (5 Pro exclusives)",
      "Poll expiry & require sign-in",
      "Live quiz leaderboards",
      "Generate with AI — 25 drafts / month (coming soon)",
      "Request custom themes",
      "Email priority support",
    ],
  },
  {
    id: "max",
    name: "Max",
    price: "$29",
    priceNote: "per month · billed monthly",
    blurb: "For power hosts who generate quizzes with AI constantly.",
    featured: true,
    features: [
      "Everything in Pro",
      "Generate with AI — 300 drafts / month (coming soon)",
      "Longer topic / notes input for AI",
      "Faster AI queue priority",
      "Bulk regenerate & refine drafts",
      "Higher daily create headroom when AI ships",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "Custom",
    priceNote: "tailored to your team",
    blurb: "For schools, companies, and orgs that need scale and help.",
    features: [
      "Everything in Max",
      "Shared AI quota for the team",
      "Team seats & shared workspaces",
      "Custom AI limits & branding options",
      "Dedicated support channel",
      "Security & procurement paperwork",
    ],
  },
];

export function PricingTiers({
  currentPlan,
  context,
  className,
}: PricingTiersProps) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {tiers.map((tier) => {
        const isCurrent =
          currentPlan !== undefined &&
          ((tier.id === "free" && currentPlan === "free") ||
            (tier.id === "pro" && currentPlan === "pro"));

        return (
          <Card
            key={tier.id}
            className={cn(
              "flex h-full flex-col border-border/70 bg-card/90 shadow-none",
              tier.featured &&
                "border-[color-mix(in_srgb,var(--brand)_45%,var(--border))]",
              context === "marketing" && "interactive-press",
            )}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {tier.name}
                </p>
                {isCurrent ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : tier.featured ? (
                  <Badge variant="secondary">Best for AI</Badge>
                ) : null}
              </div>
              <div>
                <CardTitle className="font-display text-4xl font-bold">
                  {tier.price}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.priceNote}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{tier.blurb}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {tier.id === "free" ? (
                  context === "marketing" ? (
                    <Button asChild className="w-full">
                      <Link to="/register">Start free</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/app">Back to polls</Link>
                    </Button>
                  )
                ) : null}

                {tier.id === "pro" || tier.id === "max" ? (
                  <Button
                    type="button"
                    variant={tier.featured ? "brand" : "outline"}
                    className="w-full"
                    disabled
                  >
                    {tier.id === "pro" && currentPlan === "pro"
                      ? "You’re on Pro"
                      : "Checkout coming soon"}
                  </Button>
                ) : null}

                {tier.id === "business" ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={BUSINESS_MAIL}>Contact the team</a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
