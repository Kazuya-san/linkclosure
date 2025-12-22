import { prisma } from "@/lib/prisma";

export type UserBillingRow = {
  lemonsqueezySubscriptionId: string | null;
  lemonsqueezySubscriptionStatus: string | null;
  lemonsqueezyRenewsAt: Date | null;
  lemonsqueezyEndsAt: Date | null;
};

export async function getUserBillingRow(userId: string): Promise<UserBillingRow> {
  const rows = await prisma.$queryRaw<
    Array<{
      lemonsqueezySubscriptionId: string | null;
      lemonsqueezySubscriptionStatus: string | null;
      lemonsqueezyRenewsAt: Date | null;
      lemonsqueezyEndsAt: Date | null;
    }>
  >`
    SELECT
      "lemonsqueezySubscriptionId",
      "lemonsqueezySubscriptionStatus",
      "lemonsqueezyRenewsAt",
      "lemonsqueezyEndsAt"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  return (
    rows[0] ?? {
      lemonsqueezySubscriptionId: null,
      lemonsqueezySubscriptionStatus: null,
      lemonsqueezyRenewsAt: null,
      lemonsqueezyEndsAt: null,
    }
  );
}

