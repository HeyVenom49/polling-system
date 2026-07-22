import { Link } from "react-router";
import { BRAND_NAME, FREE_DAILY_POLL_LIMIT } from "@polling-system/shared";
import { BrandMark } from "@/components/BrandMark";
import { PageShell, Parallax, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Build in minutes",
    body: "Create multi-question polls with ordered options and share a single link.",
  },
  {
    title: "Live results",
    body: "Watch responses roll in over Socket.IO the moment people vote.",
  },
  {
    title: "Theme presets",
    body: "Pick Ocean, Sunset, Midnight, and more so every poll matches the moment.",
  },
];

export function LandingPage() {
  return (
    <PageShell>
      <section className="relative mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col justify-center gap-8 overflow-hidden px-6 pb-24 pt-12">
        <Parallax intensity={28} className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-64 opacity-70">
          <div className="mx-auto h-full max-w-3xl rounded-full bg-[radial-gradient(circle_at_center,var(--atmosphere-a),transparent_70%)] blur-2xl" />
        </Parallax>

        <Reveal>
          <BrandMark size="lg" />
        </Reveal>

        <Reveal delayMs={80}>
          <div className="max-w-2xl space-y-6">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
              Polls that feel live.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
              {BRAND_NAME} — create, share, and watch results update in real
              time. Free includes {FREE_DAILY_POLL_LIMIT} new polls every day.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="brand" size="lg" className="interactive-press h-11 px-5 text-base">
                <Link to="/register">Start free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="interactive-press h-11 px-5 text-base">
                <a href="#pricing">See pricing</a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="features" className="border-y border-border/50 bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Features
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Everything you need to run a poll end to end — no design file
              required.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delayMs={index * 90}>
                <div className="interactive-press rounded-2xl border border-transparent p-1 hover:border-border/60 hover:bg-card/60">
                  <h3 className="font-display text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when you outgrow the daily create limit.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal delayMs={60}>
              <Card className="interactive-press border-border/70 bg-card/90 shadow-none">
                <CardHeader>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Free
                  </p>
                  <CardTitle className="font-display text-4xl font-bold">
                    $0
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>{FREE_DAILY_POLL_LIMIT} poll creates per day (UTC)</li>
                    <li>Live results & theme presets</li>
                    <li>Guest and authenticated voting</li>
                  </ul>
                  <Button asChild className="interactive-press">
                    <Link to="/register">Create account</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delayMs={140}>
              <Card className="interactive-press border-[color-mix(in_srgb,var(--brand)_45%,var(--border))] bg-card/90 shadow-none">
                <CardHeader>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Pro
                  </p>
                  <CardTitle className="font-display text-4xl font-bold">
                    Coming soon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Unlimited poll creates</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                  </ul>
                  <Button type="button" variant="outline" disabled>
                    Notify me later
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
