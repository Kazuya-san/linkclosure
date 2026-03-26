import { LINK_STATUSES, LINK_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

import {
  addUtcDays,
  buildAnalyticsDayKeys,
  formatAnalyticsDayKey,
  resolveAnalyticsDateRange,
  type AnalyticsResolvedDateRange,
  type AnalyticsSearchParams,
} from "./date-range";

export type AnalyticsSeriesPoint = {
  day: string;
  created: number;
  opened: number;
};

export type AnalyticsPageData = {
  range: AnalyticsResolvedDateRange;
  overview: {
    totalLinks: number;
    openedLinks: number;
    activeLinks: number;
    closedLinks: number;
    expiredLinks: number;
    remindersSent: number;
    openRate: number;
    remindersPerLink: number;
  };
  insights: {
    createdInRange: number;
    openedInRange: number;
    createdChange: number;
    openedChange: number;
    expiredShare: number;
  };
  series: AnalyticsSeriesPoint[];
};

function pctChange(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function sumSeries(
  series: AnalyticsSeriesPoint[],
  key: "created" | "opened",
) {
  return series.reduce((total, point) => total + (point[key] ?? 0), 0);
}

function countByDay(rows: Array<{ createdAt: Date }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const day = formatAnalyticsDayKey(row.createdAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return counts;
}

export async function getAnalyticsPageData(
  userId: string,
  searchParams?: AnalyticsSearchParams,
) {
  const range = resolveAnalyticsDateRange(searchParams);
  const comparisonFrom = addUtcDays(range.from, -range.days);
  const queryToExclusive = addUtcDays(range.to, 1);
  const comparisonDayKeys = buildAnalyticsDayKeys(comparisonFrom, range.to);

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

  const createdLinksPromise = prisma.link.findMany({
    where: {
      userId,
      createdAt: {
        gte: comparisonFrom,
        lt: queryToExclusive,
      },
    },
    select: { createdAt: true },
  });

  const openedEventsPromise = prisma.event.findMany({
    where: {
      type: "OPENED",
      createdAt: {
        gte: comparisonFrom,
        lt: queryToExclusive,
      },
      link: { userId },
    },
    select: { createdAt: true },
  });

  const [
    totalLinks,
    openedLinks,
    activeLinks,
    closedLinks,
    expiredLinks,
    remindersAggregate,
    createdLinks,
    openedEvents,
  ] = await Promise.all([
    totalLinksPromise,
    openedLinksPromise,
    activeLinksPromise,
    closedLinksPromise,
    expiredLinksPromise,
    remindersAggregatePromise,
    createdLinksPromise,
    openedEventsPromise,
  ]);

  const createdCounts = countByDay(createdLinks);
  const openedCounts = countByDay(openedEvents);
  const fullSeries = comparisonDayKeys.map((day) => ({
    day,
    created: createdCounts.get(day) ?? 0,
    opened: openedCounts.get(day) ?? 0,
  }));

  const series = fullSeries.slice(-range.days);
  const previousSeries = fullSeries.slice(0, range.days);

  const remindersSent = remindersAggregate._sum.remindersSent ?? 0;
  const openRate =
    totalLinks > 0 ? Math.round((openedLinks / totalLinks) * 100) : 0;
  const remindersPerLink = totalLinks > 0 ? remindersSent / totalLinks : 0;

  const createdInRange = sumSeries(series, "created");
  const openedInRange = sumSeries(series, "opened");
  const createdPreviousRange = sumSeries(previousSeries, "created");
  const openedPreviousRange = sumSeries(previousSeries, "opened");

  const expirationsTotal = expiredLinks + closedLinks;
  const expiredShare =
    expirationsTotal > 0
      ? Math.round((expiredLinks / expirationsTotal) * 100)
      : 0;

  return {
    range,
    overview: {
      totalLinks,
      openedLinks,
      activeLinks,
      closedLinks,
      expiredLinks,
      remindersSent,
      openRate,
      remindersPerLink,
    },
    insights: {
      createdInRange,
      openedInRange,
      createdChange: pctChange(createdInRange, createdPreviousRange),
      openedChange: pctChange(openedInRange, openedPreviousRange),
      expiredShare,
    },
    series,
  } satisfies AnalyticsPageData;
}
