import { CalendarDays, Hourglass, MousePointerClick } from "lucide-react";

import type { AnalyticsPageData } from "../lib/analytics-data";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatSignedPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value}%`;
}

function TrendBadge({ value, title }: { value: number; title: string }) {
  return (
    <Badge
      variant={value >= 0 ? "default" : "destructive"}
      className="ml-auto"
      title={title}
    >
      {formatSignedPct(value)}
    </Badge>
  );
}

type AnalyticsInsightsData = AnalyticsPageData["insights"];

export function AnalyticsInsights({
  insights,
  rangeLabel,
  comparisonLabel,
  expiredLinks,
  closedLinks,
}: {
  insights: AnalyticsInsightsData;
  rangeLabel: string;
  comparisonLabel: string;
  expiredLinks: number;
  closedLinks: number;
}) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Created ({rangeLabel})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="text-3xl font-semibold">{insights.createdInRange}</div>
          <TrendBadge
            value={insights.createdChange}
            title={`Change vs ${comparisonLabel}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            Opened events ({rangeLabel})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="text-3xl font-semibold">{insights.openedInRange}</div>
          <TrendBadge
            value={insights.openedChange}
            title={`Change vs ${comparisonLabel}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hourglass className="h-4 w-4" />
            Expirations mix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expired share</span>
            <span className="font-medium">{insights.expiredShare}%</span>
          </div>
          <Progress value={insights.expiredShare} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expired: {expiredLinks}</span>
            <span>Closed: {closedLinks}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
