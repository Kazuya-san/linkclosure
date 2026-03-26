import { NextResponse } from "next/server";
import { createProCheckout } from "@/lib/lemonsqueezy";
import { getCurrentUserContext } from "@/lib/current-user";
import { createLogger } from "@/lib/logger";
import { assertSameOriginOrNoOrigin, SecurityError } from "@/lib/security";

const logger = createLogger("api.billing.checkout");

export async function POST() {
  try {
    await assertSameOriginOrNoOrigin();
    const currentUser = await getCurrentUserContext();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { clerkUserId: userId, email } = currentUser;

    const { url } = await createProCheckout({ clerkUserId: userId, email });
    logger.info("Created checkout session", { userId });
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn("Rejected checkout request due to invalid origin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Failed to create checkout session", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
