import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

import { getAnalyticsPageData } from "./lib/analytics-data";
import type { AnalyticsSearchParams } from "./lib/date-range";
import { AnalyticsHeader } from "./ui/analytics-header";
import { AnalyticsInsights } from "./ui/analytics-insights";
import { AnalyticsLockState } from "./ui/analytics-lock-state";
import { AnalyticsOverviewCards } from "./ui/analytics-overview-cards";
import { AnalyticsPerformanceSection } from "./ui/analytics-performance-section";
import { Separator } from "@/components/ui/separator";

type AnalyticsPageProps = {
  searchParams?: Promise<AnalyticsSearchParams>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) redirect("/sign-in");
  if (user.plan !== PLANS.PRO) return <AnalyticsLockState />;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const analytics = await getAnalyticsPageData(userId, resolvedSearchParams);

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-6 sm:px-6">
      <AnalyticsHeader range={analytics.range} />

      <Separator className="my-6" />

      <AnalyticsOverviewCards overview={analytics.overview} />

      <AnalyticsInsights
        insights={analytics.insights}
        rangeLabel={analytics.range.cardLabel}
        comparisonLabel={analytics.range.comparisonLabel}
        expiredLinks={analytics.overview.expiredLinks}
        closedLinks={analytics.overview.closedLinks}
      />

      <AnalyticsPerformanceSection
        series={analytics.series}
        rangeDescription={analytics.range.cardLabel}
        overview={analytics.overview}
      />
    </main>
  );
}
