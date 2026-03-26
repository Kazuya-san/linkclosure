import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { PLANS, PRICING } from "@/lib/constants";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function AnalyticsLockState() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-4xl px-4 py-10 sm:px-6">
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-b from-primary/10 to-background shadow-sm">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-140px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-140px] h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-140px] h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <CardHeader className="relative space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant="outline" className="w-fit gap-2">
              <LockKeyhole className="h-3.5 w-3.5" />
              Pro feature
            </Badge>

            <Badge variant="secondary" className="w-fit gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Unlock dashboards
            </Badge>
          </div>

          <CardTitle className="text-2xl sm:text-3xl">
            Analytics is locked on Free
          </CardTitle>

          <p className="max-w-2xl text-sm text-muted-foreground">
            Upgrade to Pro to get trend charts, reminder performance, and a
            clearer picture of how your links are doing over time.
          </p>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-background/40 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4 text-primary" />
                Trend charts
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Created vs opened across custom and preset windows.
              </p>
            </div>

            <div className="rounded-xl border bg-background/40 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BellRing className="h-4 w-4 text-primary" />
                Reminder stats
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Track reminders sent and engagement lift.
              </p>
            </div>

            <div className="rounded-xl border bg-background/40 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Health insights
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                See outcomes like active, closed, and expired.
              </p>
            </div>
          </div>

          <Separator className="bg-primary/10" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UpgradeToProButton className="w-full sm:w-auto">
              Upgrade to Pro (${PRICING.USD[PLANS.PRO]}/mo)
              <ArrowRight className="ml-2 h-4 w-4" />
            </UpgradeToProButton>

            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-background/30 p-4 text-xs text-muted-foreground backdrop-blur">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <div className="font-medium text-foreground">
                  Upgrades are instant
                </div>
                <div className="mt-1">
                  Plan upgrades apply automatically after secure billing
                  confirmation. You can cancel anytime from Billing.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
