import type { AnalyticsPageData } from "../lib/analytics-data";

import { AnalyticsCharts } from "./analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function AnalyticsPerformanceSection({
  series,
  rangeDescription,
  overview,
}: {
  series: AnalyticsPageData["series"];
  rangeDescription: string;
  overview: AnalyticsPageData["overview"];
}) {
  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-1">
          <CardTitle>Activity over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Created links and opened events for {rangeDescription}.
          </p>
        </CardHeader>
        <CardContent>
          <AnalyticsCharts series={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Status breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Where your links end up over time.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Open rate</span>
              <span className="text-sm font-medium">{overview.openRate}%</span>
            </div>
            <div className="mt-2">
              <Progress value={overview.openRate} />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active</span>
              <span className="font-medium">{overview.activeLinks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Opened</span>
              <span className="font-medium">{overview.openedLinks}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Closed</span>
              <span className="font-medium">{overview.closedLinks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expired</span>
              <span className="font-medium">{overview.expiredLinks}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
