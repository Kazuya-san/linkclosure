import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/lemonsqueezy";
import { getUserBillingRow } from "@/lib/billing-db";
import { assertSameOriginOrNoOrigin, SecurityError } from "@/lib/security";

export async function POST() {
  try {
    await assertSameOriginOrNoOrigin();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const billing = await getUserBillingRow(userId);
    const subscriptionId = billing.lemonsqueezySubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { ok: true, message: "No active subscription" },
        { status: 200 }
      );
    }

    await cancelSubscription(subscriptionId);

    // Do NOT change plan here; only the signed webhook can change plan.
    return NextResponse.json(
      { ok: true, message: "Cancellation requested" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof SecurityError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
