import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { BILLING, PLANS } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api.webhooks.lemonsqueezy");

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseMaybeDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPrismaUniqueConstraintError(
  error: unknown
): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "on_trial",
  "trialing",
  "paid",
]);

type LemonSqueezyWebhookPayload = {
  meta?: {
    event_name?: string;
    event_id?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const signingSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!signingSecret) {
    logger.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", signingSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (!timingSafeEqualHex(signature, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName =
    request.headers.get("x-event-name") ?? payload.meta?.event_name ?? null;

  if (!eventName) {
    return NextResponse.json({ error: "Missing event name" }, { status: 400 });
  }

  const knownEvents = new Set([
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
    "subscription_payment_failed",
    "subscription_payment_success",
  ]);

  if (!knownEvents.has(eventName)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const proVariantId = requiredEnv("LEMONSQUEEZY_PRO_VARIANT_ID");

  const eventId =
    request.headers.get("x-event-id") ??
    payload.meta?.event_id ??
    crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");

  try {
    await (
      prisma as unknown as {
        webhookEvent: { create: (args: unknown) => Promise<unknown> };
      }
    ).webhookEvent.create({
      data: {
        id: eventId,
        provider: BILLING.LEMONSQUEEZY.PROVIDER,
      },
    });
  } catch (error: unknown) {
    // Idempotency: if we've already processed this event id, return 200.
    if (isPrismaUniqueConstraintError(error) && error.code === "P2002") {
      logger.info("Deduped webhook event", { eventId });
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }
    logger.error("Failed to record webhook event", { error, eventId });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const subscriptionId = payload.data?.id ?? null;
  const attributes = payload.data?.attributes ?? {};

  const variantId = attributes["variant_id"];
  if (String(variantId) !== proVariantId) {
    // Ignore subscriptions for other variants to avoid cross-product upgrades.
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const status = attributes["status"];
  const normalizedStatus =
    typeof status === "string" ? status.toLowerCase() : "";

  const customData = payload.meta?.custom_data ?? {};
  const clerkUserId =
    (customData["clerk_user_id"] as string | undefined) ??
    (customData["user_id"] as string | undefined) ??
    null;

  const emailFromCustom =
    (customData["email"] as string | undefined) ??
    (attributes["user_email"] as string | undefined) ??
    null;

  if (!clerkUserId) {
    logger.error("Webhook missing clerk_user_id in custom data", { eventId });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const forceFreeEvents = new Set([
    "subscription_cancelled",
    "subscription_expired",
    "subscription_payment_failed",
  ]);

  const shouldBePro = forceFreeEvents.has(eventName)
    ? false
    : ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus);
  const plan = shouldBePro ? PLANS.PRO : PLANS.FREE;

  const lemonsqueezyCustomerId =
    typeof attributes["customer_id"] === "number" ||
    typeof attributes["customer_id"] === "string"
      ? String(attributes["customer_id"])
      : null;

  const renewsAt = parseMaybeDate(attributes["renews_at"]);
  const endsAt = parseMaybeDate(attributes["ends_at"]);

  try {
    const existing = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });

    if (!existing && !emailFromCustom) {
      logger.error("Webhook could not create user because email is missing", {
        clerkUserId,
        eventId,
      });
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await (
      prisma.user as unknown as { upsert: (args: unknown) => Promise<unknown> }
    ).upsert({
      where: { id: clerkUserId },
      update: {
        plan,
        lemonsqueezyCustomerId: lemonsqueezyCustomerId ?? undefined,
        lemonsqueezySubscriptionId: subscriptionId ?? undefined,
        lemonsqueezySubscriptionStatus:
          typeof attributes["status"] === "string"
            ? attributes["status"]
            : undefined,
        lemonsqueezyRenewsAt: renewsAt ?? undefined,
        lemonsqueezyEndsAt: endsAt ?? undefined,
      },
      create: {
        id: clerkUserId,
        email: emailFromCustom!,
        plan,
        lemonsqueezyCustomerId: lemonsqueezyCustomerId ?? undefined,
        lemonsqueezySubscriptionId: subscriptionId ?? undefined,
        lemonsqueezySubscriptionStatus:
          typeof attributes["status"] === "string"
            ? attributes["status"]
            : undefined,
        lemonsqueezyRenewsAt: renewsAt ?? undefined,
        lemonsqueezyEndsAt: endsAt ?? undefined,
      },
    });
  } catch (error) {
    logger.error("Failed to sync subscription from webhook", {
      error,
      eventId,
      clerkUserId,
      subscriptionId,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  logger.info("Processed Lemon Squeezy webhook", {
    eventId,
    eventName,
    clerkUserId,
    subscriptionId,
    plan,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
