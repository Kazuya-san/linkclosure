import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  // Middleware handles auth protection, but we still need to check for user sync
  if (!userId || !user) {
    redirect("/sign-in");
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null;

  if (!email) {
    redirect("/sign-in");
  }

  // Upsert user on first visit
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email,
      plan: "FREE",
    },
  });

  return (
    <div className="bg-background">
      <div className="container mx-auto">{children}</div>
    </div>
  );
}
