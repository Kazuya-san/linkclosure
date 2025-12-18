import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkForm from "./link-form";
import LinkList from "./link-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LinkIcon } from "lucide-react";

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
  const maxLinks = isFreePlan ? 5 : Infinity;
  const linkUsagePercent = isFreePlan ? (linkCount / 5) * 100 : 0;

  const stats = {
    total: links.length,
    opened: links.filter((l) => l.firstOpenedAt).length,
    closed: links.filter((l) => l.status === "CLOSED").length,
    expired: links.filter((l) => l.status === "EXPIRED").length,
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-8 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your closure links
            </p>
          </div>
        </div>
        {isFreePlan && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  FREE Plan Usage
                </CardTitle>
                <Badge variant="outline">{linkCount}/5 links</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={linkUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {5 - linkCount} links remaining
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create New Link</CardTitle>
              <CardDescription>
                Generate a new closure link with custom settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkForm userPlan={user.plan} linkCount={linkCount} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Your Links</h2>
              <p className="text-sm text-muted-foreground">
                Manage and track all your closure links
              </p>
            </div>
            <LinkList initialLinks={links} />
          </div>
        </div>
      </div>
    </main>
  );
}
