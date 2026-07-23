import { Link } from "react-router";
import { BRAND_NAME, FREE_DAILY_POLL_LIMIT } from "@polling-system/shared";
import { PollPreview } from "@/components/landing/PollPreview";
import { BrandMark } from "@/components/BrandMark";
import { PageShell, Parallax, Reveal } from "@/components/motion";
import { PricingTiers } from "@/components/PricingTiers";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    title: "Create",
    body: "Build a live quiz or an open poll. Mark correct answers for quizzes, pick a theme, and share when you’re ready.",
  },
  {
    step: "02",
    title: "Share",
    body: "Send a link or QR. Open polls can take guest votes; live quizzes ask users to sign in so each person answers once.",
  },
  {
    step: "03",
    title: "Run live",
    body: "For quizzes, reveal one question at a time with a timer and a leaderboard. Open polls stream results as votes land.",
  },
];

const features = [
  {
    title: "Live quizzes",
    body: "Host-controlled questions, countdown timers, and a scoreboard of who got it right.",
  },
  {
    title: "Open polls",
    body: "Share a link for guest-friendly voting when you don’t need accounts or scoring.",
  },
  {
    title: "Live results",
    body: "Bars and totals update the moment someone responds — publish when you’re ready to show the room.",
  },
  {
    title: "Theme presets",
    body: "Ocean, Sunset, Midnight, and more so every session matches the room you’re in.",
  },
  {
    title: "Creator insights",
    body: "See response splits, recent activity, and day-by-day trends on the manage page.",
  },
];

const audiences = [
  {
    title: "Meetings & workshops",
    body: "Pulse-check a room without breaking the flow. Share a link, get a read in minutes.",
  },
  {
    title: "Classrooms",
    body: "Run timed live quizzes. Users sign in once, answer once per question, and see the leaderboard.",
  },
  {
    title: "Communities",
    body: "Run decisions in Discord, Slack, or email with a poll that actually feels alive.",
  },
];

export function LandingPage() {
  return (
    <PageShell>
      {/* Hero — brand, one line, one CTA group, full-bleed visual plane */}
      <section className="relative isolate min-h-[min(100dvh,920px)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_85%_20%,var(--atmosphere-a),transparent_55%),radial-gradient(ellipse_60%_50%_at_10%_90%,var(--atmosphere-b),transparent_50%)]" />
          <Parallax
            intensity={36}
            className="absolute inset-y-0 right-0 hidden w-[55%] lg:block"
          >
            <div className="flex h-full items-center justify-center pr-8 xl:pr-16">
              <PollPreview
                ambient
                className="w-full max-w-md scale-110 opacity-80 blur-[0.5px]"
              />
            </div>
          </Parallax>
          <div className="absolute inset-y-0 right-0 hidden w-[45%] bg-gradient-to-l from-transparent via-background/20 to-background lg:block" />
        </div>

        <div className="relative mx-auto flex min-h-[min(100dvh,920px)] w-full max-w-6xl flex-col justify-center px-6 pb-24 pt-16">
          <Reveal>
            <BrandMark size="lg" />
          </Reveal>

          <Reveal delayMs={90}>
            <div className="mt-8 max-w-xl space-y-6 lg:max-w-2xl">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
                Polls that feel live.
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
                Live quizzes for the room, open polls for quick votes — free for{" "}
                {FREE_DAILY_POLL_LIMIT} new creates every day.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  variant="brand"
                  size="lg"
                  className="interactive-press h-11 px-5 text-base"
                >
                  <Link to="/register">Start free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="interactive-press h-11 px-5 text-base"
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={160} className="mt-14 lg:hidden">
            <PollPreview />
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Three steps from blank page to a room full of live answers.
            </p>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((item, index) => (
              <Reveal key={item.step} delayMs={index * 90}>
                <li>
                  <p className="font-display text-sm font-semibold tracking-[0.18em] text-brand">
                    {item.step}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground">{item.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="preview"
        className="border-y border-border/50 bg-card/40 py-24"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div>
              <h2 className="font-display text-3xl font-semibold md:text-4xl">
                Results that move with the room
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                {BRAND_NAME} pushes updates the instant a vote lands. You see
                the truth while people are still answering — then publish when
                you want the crowd to see it too.
              </p>
              <Button
                asChild
                variant="brand"
                className="mt-8 interactive-press"
              >
                <Link to="/register">Try it free</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <PollPreview className="interactive-press" />
          </Reveal>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Built for real sessions
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Everything you need to run a poll end to end — no design file
              required.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delayMs={Math.min(index * 70, 280)}>
                <div>
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

      <section id="use-cases" className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Made for rooms that decide together
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Same product, different moments — keep the energy, skip the
              spreadsheet.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {audiences.map((item, index) => (
              <Reveal key={item.title} delayMs={index * 90}>
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border/50 bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Pricing
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Clear options for individuals and teams. Start free, upgrade when
              you need more, or talk to us for Business.
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-12">
              <PricingTiers context="marketing" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_80%_at_50%_120%,var(--atmosphere-a),transparent_60%)]"
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <p className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {BRAND_NAME}
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Build the quiz. Share the link. Watch the room answer.
            </p>
            <Button
              asChild
              variant="brand"
              size="lg"
              className="mt-8 interactive-press h-11 px-6 text-base"
            >
              <Link to="/register">Start free</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
