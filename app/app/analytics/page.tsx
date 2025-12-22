import "server-only";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LINK_STATUSES, LINK_STATUS } from "@/lib/constants";

import { AnalyticsCharts } from "./ui/analytics-charts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Hourglass,
  Link2,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

function formatDayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lastNDaysKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(formatDayKey(d));
  }
  return keys;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function formatSignedPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

function sumSeries(
  arr: Array<{ created: number; opened: number }>,
  key: "created" | "opened"
) {
  return arr.reduce((acc, d) => acc + (d[key] ?? 0), 0);
}

function TrendBadge({ value }: { value: number }) {
  return (
    <Badge
      variant={value >= 0 ? "default" : "destructive"}
      className="ml-auto"
      title="Change vs previous 7 days"
    >
      {formatSignedPct(value)}
    </Badge>
  );
}

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // ---------- Aggregate counts ----------
  const totalLinksPromise = prisma.link.count({ where: { userId } });
  const openedLinksPromise = prisma.link.count({
    where: { userId, firstOpenedAt: { not: null } },
  });
  const closedLinksPromise = prisma.link.count({
    where: { userId, status: LINK_STATUSES.CLOSED },
  });
  const expiredLinksPromise = prisma.link.count({
    where: { userId, status: LINK_STATUSES.EXPIRED },
  });
  const activeLinksPromise = prisma.link.count({
    where: {
      userId,
      status: { in: [...LINK_STATUS.REMINDER_ELIGIBLE] },
    },
  });

  const remindersAggregatePromise = prisma.link.aggregate({
    where: { userId },
    _sum: { remindersSent: true },
  });

  // ---------- Timeseries (last N days) ----------
  const days = 14;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  const createdByDayPromise = prisma.$queryRaw<
    Array<{ day: Date; count: number }>
  >`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "Link"
    WHERE "userId" = ${userId} AND "createdAt" >= ${start}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const openedEventsByDayPromise = prisma.$queryRaw<
    Array<{ day: Date; count: number }>
  >`
    SELECT date_trunc('day', e."createdAt") AS day, COUNT(*)::int AS count
    FROM "Event" e
    JOIN "Link" l ON l."id" = e."linkId"
    WHERE l."userId" = ${userId}
      AND e."type" = 'OPENED'
      AND e."createdAt" >= ${start}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const [
    totalLinks,
    openedLinks,
    activeLinks,
    closedLinks,
    expiredLinks,
    remindersAggregate,
    createdByDay,
    openedEventsByDay,
  ] = await Promise.all([
    totalLinksPromise,
    openedLinksPromise,
    activeLinksPromise,
    closedLinksPromise,
    expiredLinksPromise,
    remindersAggregatePromise,
    createdByDayPromise,
    openedEventsByDayPromise,
  ]);

  const remindersSent = remindersAggregate._sum.remindersSent ?? 0;

  // ---------- Build chart series with zero-fill ----------
  const dayKeys = lastNDaysKeys(days);

  const createdCounts = new Map<string, number>();
  for (const row of createdByDay)
    createdCounts.set(formatDayKey(row.day), row.count);

  const openedCounts = new Map<string, number>();
  for (const row of openedEventsByDay)
    openedCounts.set(formatDayKey(row.day), row.count);

  const series = dayKeys.map((day) => ({
    day,
    created: createdCounts.get(day) ?? 0,
    opened: openedCounts.get(day) ?? 0,
  }));

  // ---------- “Modern” dashboard extras ----------
  const openRate =
    totalLinks > 0 ? Math.round((openedLinks / totalLinks) * 100) : 0;
  const remindersPerLink = totalLinks > 0 ? remindersSent / totalLinks : 0;

  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);

  const created7 = sumSeries(last7, "created");
  const opened7 = sumSeries(last7, "opened");

  const createdPrev7 = sumSeries(prev7, "created");
  const openedPrev7 = sumSeries(prev7, "opened");

  const createdWoW = pctChange(created7, createdPrev7);
  const openedWoW = pctChange(opened7, openedPrev7);

  const expirationsTotal = expiredLinks + closedLinks;
  const expiredShare =
    expirationsTotal > 0
      ? Math.round((expiredLinks / expirationsTotal) * 100)
      : 0;

  const rangeLabel = (() => {
    const first = series[0]?.day;
    const last = series[series.length - 1]?.day;
    if (!first || !last) return `Last ${days} days`;
    // Avoid timezone shifting: parse as local midnight string
    const fmt = (d: string) =>
      new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    return `${fmt(first)} → ${fmt(last)}`;
  })();

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {rangeLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A clean snapshot of your link performance and engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/links"
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            View links
          </Link>
        </div>
      </div>

      <Separator className="my-6" />

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Total links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold">{totalLinks}</div>
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
            <div className="text-3xl font-semibold">{openedLinks}</div>
            <span className="text-sm text-muted-foreground">
              {openRate}% rate
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
            {activeLinks}
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
            {closedLinks}
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
            <div className="text-3xl font-semibold">{remindersSent}</div>
            <span className="text-sm text-muted-foreground">
              {remindersPerLink.toFixed(2)}/link
            </span>
          </CardContent>
        </Card>
      </section>

      {/* Insights */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Created (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="text-3xl font-semibold">{created7}</div>
            <TrendBadge value={createdWoW} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              Opened events (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="text-3xl font-semibold">{opened7}</div>
            <TrendBadge value={openedWoW} />
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
              <span className="font-medium">{expiredShare}%</span>
            </div>
            <Progress value={expiredShare} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expired: {expiredLinks}</span>
              <span>Closed: {closedLinks}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Chart + side card */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Activity over time</CardTitle>
            <p className="text-sm text-muted-foreground">
              Created links and opened events for the last {days} days.
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
                <span className="text-sm font-medium">{openRate}%</span>
              </div>
              <div className="mt-2">
                <Progress value={openRate} />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{activeLinks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Opened</span>
                <span className="font-medium">{openedLinks}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Closed</span>
                <span className="font-medium">{closedLinks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expired</span>
                <span className="font-medium">{expiredLinks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
