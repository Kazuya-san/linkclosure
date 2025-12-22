import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkList from "./link-list";
import CreateLinkButton from "./create-link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  SparklesIcon,
  ArrowRightIcon,
  LinkIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LIMITS, LINK_STATUSES, PLANS } from "@/lib/constants";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";

export default async function AppPage() {
  const { userId } = await auth();

  // Middleware handles auth, but we still need userId for queries
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const links = await prisma.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const linkCount = links.length;
  const isFreePlan = user.plan === PLANS.FREE;
  const freeMaxLinks = LIMITS.LINKS[PLANS.FREE];
  const linkUsagePercent = isFreePlan ? (linkCount / freeMaxLinks) * 100 : 0;
  const remainingLinks = isFreePlan
    ? Math.max(0, freeMaxLinks - linkCount)
    : Number.POSITIVE_INFINITY;

  const openedCount = links.filter((l) => l.firstOpenedAt).length;
  const activeCount = links.filter(
    (l) => l.status !== LINK_STATUSES.EXPIRED && l.status !== LINK_STATUSES.CLOSED
  ).length;
  const closedCount = links.filter((l) => l.status === LINK_STATUSES.CLOSED).length;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-7xl flex-col overflow-hidden px-4 py-6 sm:px-4">
      {/* Header */}
      <div className="shrink-0 space-y-1 pb-4 sm:pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage your closure links
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-12">
        {/* Left Column - Sidebar */}
        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto overflow-x-hidden lg:col-span-4">
          {/* Create Link Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Link</CardTitle>
              <CardDescription>
                Generate a smart closure link in seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateLinkButton userPlan={user.plan} linkCount={linkCount} />
            </CardContent>
          </Card>

          {/* Stats Card */}
          {links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Links</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {links.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Opened</span>
                    </div>
                    <span className="text-lg font-semibold">{openedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <span className="text-lg font-semibold">{activeCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Closed</span>
                    <span className="text-lg font-semibold">{closedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Usage Card */}
          {isFreePlan && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Plan Usage</CardTitle>
                <CardDescription className="text-xs">
                  {remainingLinks > 0
                    ? `${remainingLinks} link${
                        remainingLinks > 1 ? "s" : ""
                      } remaining`
                    : "All free links used"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">FREE Plan</span>
                    <span className="font-medium">
                      {linkCount}/{freeMaxLinks} links
                    </span>
                  </div>
                  <Progress value={linkUsagePercent} className="h-2" />
                </div>
                <UpgradeToProButton size="sm" variant="default" className="w-full">
                  Upgrade to PRO
                  <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                </UpgradeToProButton>
              </CardContent>
            </Card>
          )}

          {/* Upgrade Banner for FREE users at limit */}
          {isFreePlan && remainingLinks === 0 && (
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
                <div className="h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              </div>
              <CardContent className="relative space-y-3 p-6">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    You&apos;ve used all free links
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upgrade to PRO for unlimited links, custom slugs, and more
                  reminders
                </p>
                <UpgradeToProButton size="sm" variant="default" className="w-full">
                  Upgrade to PRO
                  <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                </UpgradeToProButton>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Right Column - Main Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:col-span-8">
          <ScrollArea className="h-[calc(100vh-13rem)] px-3">
            {/* Links List */}
            <div className="space-y-4">
              {links.length === 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {/* {links.length > 0 ? "Your Links" : "No links yet"} */}
                      {/* {links.length === 0 && "No links yet"} */}
                      No links yet
                    </h2>
                    {/* {links.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage and track all your closure links
                </p>
              )} */}
                  </div>
                </div>
              )}
              <LinkList initialLinks={links} />
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}
