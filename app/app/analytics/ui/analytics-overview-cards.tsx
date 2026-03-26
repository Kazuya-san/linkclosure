import { Activity, Bell, CheckCircle2, Link2, MousePointerClick } from "lucide-react";

import type { AnalyticsPageData } from "../lib/analytics-data";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsOverview = AnalyticsPageData["overview"];

export function AnalyticsOverviewCards({
  overview,
}: {
  overview: AnalyticsOverview;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4" />
            Total links
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold">{overview.totalLinks}</div>
          <span className="text-sm text-muted-foreground">all time</span>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            Opened
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold">{overview.openedLinks}</div>
          <span className="text-sm text-muted-foreground">
            {overview.openRate}% rate
          </span>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Active
          </CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {overview.activeLinks}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Closed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {overview.closedLinks}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold">{overview.remindersSent}</div>
          <span className="text-sm text-muted-foreground">
            {overview.remindersPerLink.toFixed(2)}/link
          </span>
        </CardContent>
      </Card>
    </section>
  );
}
