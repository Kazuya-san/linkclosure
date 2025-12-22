import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LIMITS, PLANS, PRICING } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  CheckIcon,
  SparklesIcon,
  ZapIcon,
  ShieldCheckIcon,
  InfinityIcon,
  ArrowRightIcon,
} from "lucide-react";
import type { Plan } from "@prisma/client";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";

const features = {
  free: [
    `${LIMITS.LINKS[PLANS.FREE]} closure links`,
    `${LIMITS.REMINDERS_PER_LINK[PLANS.FREE]} reminder per link`,
    "Auto-expiration",
    "Open notifications",
    "Status tracking",
    "Email reminders",
  ],
  pro: [
    "Unlimited closure links",
    `${LIMITS.REMINDERS_PER_LINK[PLANS.PRO]} reminders per link`,
    "Custom slugs",
    "Auto-expiration",
    "Open notifications",
    "Status tracking",
    "Email reminders",
    "Priority support",
    "Advanced analytics",
  ],
};

const comparison = [
  { label: "Closure links", free: String(LIMITS.LINKS[PLANS.FREE]), pro: "Unlimited" },
  {
    label: "Reminders",
    free: `${LIMITS.REMINDERS_PER_LINK[PLANS.FREE]} / link`,
    pro: `${LIMITS.REMINDERS_PER_LINK[PLANS.PRO]} / link`,
  },
  { label: "Auto-expiration", free: true, pro: true },
  { label: "Open notifications", free: true, pro: true },
  { label: "Status tracking", free: true, pro: true },
  { label: "Email reminders", free: true, pro: true },
  { label: "Custom slugs", free: false, pro: true },
  { label: "Advanced analytics", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

function CheckCell({ ok }: { ok: boolean }) {
  return ok ? (
    <div className="inline-flex items-center justify-center">
      <CheckIcon className="h-4 w-4 text-primary" />
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

export default async function PricingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  let currentPlan: Plan = PLANS.FREE;

  if (isSignedIn && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) currentPlan = user.plan;
  }

  const freeCTA = isSignedIn ? (
    currentPlan === PLANS.FREE ? (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    ) : (
      <Button variant="outline" className="w-full" asChild>
        <Link href="/app">Go to Dashboard</Link>
      </Button>
    )
  ) : (
    <Button variant="outline" className="w-full" asChild>
      <Link href="/sign-up">Get Started</Link>
    </Button>
  );

  const proCTA = isSignedIn && currentPlan === PLANS.PRO ? (
      <Button className="w-full" disabled>
        Current Plan
      </Button>
    ) : isSignedIn && currentPlan === PLANS.FREE ? (
      <UpgradeToProButton className="w-full">
        Upgrade to PRO <ArrowRightIcon className="ml-2 h-4 w-4" />
      </UpgradeToProButton>
    ) : (
      <Button className="w-full" asChild>
        <Link href="/sign-up">
          Get Started <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );

  return (
    <main className="relative min-h-[calc(100vh-4rem)]">
      {/* Background accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-140px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-140px] h-[460px] w-[460px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-2 text-sm shadow-sm">
            <SparklesIcon className="h-4 w-4" />
            <span className="text-muted-foreground">
              Simple, transparent pricing
            </span>
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Start free and upgrade when you need more. No hidden fees, cancel
            anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
          {/* FREE */}
          <Card className="relative overflow-hidden bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">FREE</CardTitle>
                  <CardDescription className="mt-1">
                    Perfect for trying out closure links
                  </CardDescription>
                </div>

                {currentPlan === "FREE" && (
                  <Badge variant="outline" className="rounded-full">
                    Current
                  </Badge>
                )}
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold">$0</span>
                <span className="pb-1 text-sm text-muted-foreground">
                  /month
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col gap-6">
              <ul className="space-y-3">
                {features.free.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-muted/60">
                      <CheckIcon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="text-sm text-foreground/90">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">{freeCTA}</div>
            </CardContent>
          </Card>

          {/* PRO */}
          <Card className="group relative overflow-hidden border-primary/30 bg-gradient-to-b from-primary/10 to-background shadow-sm">
            {/* glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 opacity-60 blur-2xl transition-opacity group-hover:opacity-100"
            >
              <div className="absolute left-1/2 top-4 h-40 w-72 -translate-x-1/2 rounded-full bg-primary/25" />
            </div>

            <div className="absolute right-4 top-4">
              <Badge className="rounded-full bg-primary text-primary-foreground shadow-sm">
                Most Popular
              </Badge>
            </div>

            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">PRO</CardTitle>
                  <CardDescription className="mt-1">
                    For power users and teams
                  </CardDescription>
                </div>

                {currentPlan === "PRO" && (
                  <Badge variant="outline" className="rounded-full">
                    Current
                  </Badge>
                )}
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold">
                  ${PRICING.USD[PLANS.PRO]}
                </span>
                <span className="pb-1 text-sm text-muted-foreground">
                  /month
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Includes everything in Free, plus:
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col gap-6">
              <ul className="space-y-3">
                {features.pro.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-muted/60">
                      <CheckIcon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="text-sm text-foreground/90">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">{proCTA}</div>

              <p className="text-center text-xs text-muted-foreground">
                Cancel anytime. No hidden fees.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison */}
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-6 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Compare plans
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything included at a glance.
            </p>
          </div>

          <Card className="overflow-hidden bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-3 border-b bg-muted/40">
                <div className="px-6 py-4 text-sm font-medium text-muted-foreground">
                  Feature
                </div>
                <div className="px-6 py-4 text-sm font-medium">Free</div>
                <div className="px-6 py-4 text-sm font-medium">Pro</div>
              </div>

              <div className="divide-y">
                {comparison.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 px-0">
                    <div className="px-6 py-4 text-sm text-foreground/90">
                      {row.label}
                    </div>
                    <div className="px-6 py-4 text-sm">
                      {typeof row.free === "boolean" ? (
                        <CheckCell ok={row.free} />
                      ) : (
                        <span className="text-muted-foreground">
                          {row.free}
                        </span>
                      )}
                    </div>
                    <div className="px-6 py-4 text-sm">
                      {typeof row.pro === "boolean" ? (
                        <CheckCell ok={row.pro} />
                      ) : (
                        <span className="text-foreground/90">{row.pro}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile comparison */}
            <div className="md:hidden">
              <div className="border-b bg-muted/40 px-5 py-4">
                <div className="text-sm font-medium">Plan comparison</div>
                <div className="text-xs text-muted-foreground">
                  Scroll to see what’s included.
                </div>
              </div>

              <div className="divide-y">
                {comparison.map((row) => (
                  <div key={row.label} className="px-5 py-4">
                    <div className="text-sm font-medium">{row.label}</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <div className="text-xs text-muted-foreground">
                          Free
                        </div>
                        <div className="mt-1">
                          {typeof row.free === "boolean" ? (
                            <CheckCell ok={row.free} />
                          ) : (
                            <span className="text-muted-foreground">
                              {row.free}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <div className="text-xs text-muted-foreground">Pro</div>
                        <div className="mt-1">
                          {typeof row.pro === "boolean" ? (
                            <CheckCell ok={row.pro} />
                          ) : (
                            <span className="text-foreground/90">
                              {row.pro}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Trust cards */}
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/60">
                  <ZapIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create your first closure link in seconds. No complex setup.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/60">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your links are secure and tracked. We never sell your data.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/60">
                  <InfinityIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Always Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  99.9% uptime target so your links work when you need them.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mx-auto max-w-3xl text-center">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/10 to-background shadow-sm">
            <CardHeader>
              <CardTitle>Questions?</CardTitle>
              <CardDescription>
                We’re here to help. Reach out any time about plans or features.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/app">Go to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">
                  Start Free <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
