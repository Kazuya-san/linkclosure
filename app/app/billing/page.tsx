import "server-only";

import { PLANS } from "@/lib/constants";
import { getUserBillingRow } from "@/lib/billing-db";
import { requireCurrentUserPage } from "@/lib/current-user";

import { BillingActions } from "./ui/billing-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  BadgeCheck,
  CreditCard,
  Gem,
  Receipt,
  ShieldCheck,
} from "lucide-react";

function prettyPlan(plan: string) {
  // Optional nicety for display
  return plan
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

export default async function BillingPage() {
  const { clerkUserId: userId, user } = await requireCurrentUserPage();

  const billing = await getUserBillingRow(userId);
  const subscriptionId = billing.lemonsqueezySubscriptionId ?? null;
  const subscriptionStatus = billing.lemonsqueezySubscriptionStatus ?? null;

  const isPro = user.plan === PLANS.PRO;

  // Simple status styling
  const statusVariant =
    subscriptionStatus?.toLowerCase() === "active"
      ? "default"
      : subscriptionStatus
      ? "secondary"
      : "outline";

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
            <Badge variant={isPro ? "default" : "secondary"} className="gap-1">
              {isPro ? (
                <Gem className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, invoices, and plan settings.
          </p>
        </div>

        {/* Optional quick CTA (purely cosmetic; link wherever your app supports) */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.lemonsqueezy.com"
              target="_blank"
              rel="noreferrer"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Billing portal
            </a>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6">
        {/* Summary row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4" />
                Current plan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2">
              <div className="text-2xl font-semibold">
                {prettyPlan(user.plan)}
              </div>
              <span className="text-sm text-muted-foreground">
                {isPro ? "All features unlocked" : "Upgrade anytime"}
              </span>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {subscriptionId ? (
                <>
                  <div className="text-sm font-medium">
                    {subscriptionId.length > 14
                      ? `${subscriptionId.slice(0, 8)}...${subscriptionId.slice(
                          -6
                        )}`
                      : subscriptionId}
                  </div>
                  {subscriptionStatus && (
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant}>
                        {prettyPlan(subscriptionStatus)}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No subscription on file.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Access receipts and billing details in the portal.
            </CardContent>
          </Card>
        </div>

        {/* Main plan card */}
        <Card className="py-4">
          <CardHeader className="space-y-1">
            <CardTitle>Plan & subscription</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upgrade, downgrade, or manage your subscription status.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-medium">{prettyPlan(user.plan)}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {isPro
                    ? "You're on Pro. Enjoy the full feature set."
                    : "You're on Free. Upgrade to unlock Pro features."}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-medium">
                    {subscriptionStatus ? prettyPlan(subscriptionStatus) : "-"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {subscriptionId
                    ? "Subscription is linked to your account."
                    : "No active subscription is linked."}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm font-medium">Actions</div>
              <BillingActions isPro={isPro} />
            </div>

            <div className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-medium text-foreground">
                    Secure payments
                  </div>
                  <div className="mt-1">
                    Your payment info is handled by Lemon Squeezy. You can
                    manage invoices and cancellations via the billing portal.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
