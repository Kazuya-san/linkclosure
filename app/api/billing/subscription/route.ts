import { NextResponse } from "next/server";
import { getSubscription } from "@/lib/lemonsqueezy";
import { getUserBillingRow } from "@/lib/billing-db";
import { getCurrentUserContext } from "@/lib/current-user";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api.billing.subscription");

export async function GET() {
  try {
    const currentUser = await getCurrentUserContext();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { clerkUserId: userId, user } = currentUser;

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
    logger.error("Failed to fetch subscription", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
