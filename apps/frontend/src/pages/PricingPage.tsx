import { PageShell, Reveal } from "@/components/motion";
import { PricingTiers } from "@/components/PricingTiers";
import { useAuth } from "@/features/auth/AuthContext";

export function PricingPage() {
  const { user } = useAuth();
  const currentPlan = user?.plan === "pro" ? "pro" : "free";

  return (
    <PageShell className="mx-auto max-w-6xl space-y-8">
      <Reveal>
        <div>
          <h1 className="font-display text-3xl font-semibold">Pricing</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pick what fits today. Free to start, Pro when you need more room,
            Business when your team needs a hand.
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={80}>
        <PricingTiers context="app" currentPlan={currentPlan} />
      </Reveal>
    </PageShell>
  );
}
