import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  );
}

export async function ensureCurrentUserRecord() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = getPrimaryEmail(user);

  if (!user || !email) return null;

  return prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: {
      id: userId,
      email,
      plan: PLANS.FREE,
    },
  });
}
