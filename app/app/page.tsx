import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkList from "./link-list";
import CreateLinkButton from "./create-link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { SparklesIcon, ArrowRightIcon, LinkIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";

export default async function AppPage() {
  const { userId } = await auth();

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
  const isFreePlan = user.plan === "FREE";
  const linkUsagePercent = isFreePlan ? (linkCount / 5) * 100 : 0;
  const remainingLinks = isFreePlan ? Math.max(0, 5 - linkCount) : Infinity;

  const openedCount = links.filter((l) => l.firstOpenedAt).length;
  const activeCount = links.filter(
    (l) => l.status !== "EXPIRED" && l.status !== "CLOSED"
  ).length;
  const closedCount = links.filter((l) => l.status === "CLOSED").length;

  return (
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-7xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      {/* Header */}
      <div className="shrink-0 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage your closure links
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Sidebar */}
        <aside className="flex flex-col gap-6 overflow-y-auto lg:col-span-4">
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
                    <span className="text-lg font-semibold">{links.length}</span>
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
                    ? `${remainingLinks} link${remainingLinks > 1 ? "s" : ""} remaining`
                    : "All free links used"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">FREE Plan</span>
                    <span className="font-medium">{linkCount}/5 links</span>
                  </div>
                  <Progress value={linkUsagePercent} className="h-2" />
                </div>
                <Button size="sm" variant="default" className="w-full" asChild>
                  <Link href="/pricing">
                    Upgrade to PRO
                    <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
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
                    You've used all free links
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upgrade to PRO for unlimited links, custom slugs, and more
                  reminders
                </p>
                <Button size="sm" variant="default" className="w-full" asChild>
                  <Link href="/pricing">
                    Upgrade to PRO
                    <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* Right Column - Main Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:col-span-8">
          {/* Links List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {links.length > 0 ? "Your Links" : "No links yet"}
                </h2>
                {links.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage and track all your closure links
                  </p>
                )}
              </div>
            </div>
            <LinkList initialLinks={links} />
          </div>
        </div>
      </div>
    </main>
  );
}
