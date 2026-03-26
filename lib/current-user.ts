import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  );
}

export type CurrentUserContext = {
  clerkUserId: string;
  email: string;
  user: User;
};

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = getPrimaryEmail(clerkUser);

  if (!clerkUser || !email) return null;

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: {
      id: userId,
      email,
      plan: PLANS.FREE,
    },
  });

  return {
    clerkUserId: userId,
    email,
    user,
  };
}

export async function requireCurrentUserPage() {
  const currentUser = await getCurrentUserContext();

  if (!currentUser) {
    redirect("/sign-in");
  }

  return currentUser;
}
