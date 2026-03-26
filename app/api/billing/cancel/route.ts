import { NextResponse } from "next/server";
import { cancelSubscription } from "@/lib/lemonsqueezy";
import { getUserBillingRow } from "@/lib/billing-db";
import { getCurrentUserContext } from "@/lib/current-user";
import { createLogger } from "@/lib/logger";
import { assertSameOriginOrNoOrigin, SecurityError } from "@/lib/security";

const logger = createLogger("api.billing.cancel");

export async function POST() {
  try {
    await assertSameOriginOrNoOrigin();
    const currentUser = await getCurrentUserContext();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { clerkUserId: userId } = currentUser;

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
    logger.info("Cancellation requested", { userId, subscriptionId });
    return NextResponse.json(
      { ok: true, message: "Cancellation requested" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn("Rejected cancellation request due to invalid origin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Failed to cancel subscription", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
