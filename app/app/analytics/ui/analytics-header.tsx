import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { AnalyticsResolvedDateRange } from "../lib/date-range";

import { Badge } from "@/components/ui/badge";
import { AnalyticsRangeFilter } from "./analytics-range-filter";

export function AnalyticsHeader({ range }: { range: AnalyticsResolvedDateRange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {range.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          A clean snapshot of your link performance and engagement.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AnalyticsRangeFilter
          value={range.value}
          fromKey={range.fromKey}
          toKey={range.toKey}
          customLabel={range.filterLabel}
        />
        <Link
          href="/app"
          className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition hover:bg-muted"
        >
          View links
        </Link>
      </div>
    </div>
  );
}
