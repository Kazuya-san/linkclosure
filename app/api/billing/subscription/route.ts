import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/lemonsqueezy";
import { getUserBillingRow } from "@/lib/billing-db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
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
        {
          plan: user.plan,
          subscription: null,
        },
        { status: 200 }
      );
    }

    const subscription = await getSubscription(subscriptionId);

    return NextResponse.json(
      {
        plan: user.plan,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          renewsAt: subscription.renews_at,
          endsAt: subscription.ends_at,
          urls: subscription.urls,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
