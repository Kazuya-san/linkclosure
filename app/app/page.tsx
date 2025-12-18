import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkForm from "./link-form";
import LinkList from "./link-list";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">LinkClosure</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage your closure links
        </p>
        {isFreePlan && (
          <p className="text-xs text-muted-foreground mt-1">
            FREE Plan: {linkCount}/5 links used
          </p>
        )}
      </div>

      <LinkForm userPlan={user.plan} linkCount={linkCount} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Links</h2>
        <LinkList initialLinks={links} />
      </div>
    </main>
  );
}
