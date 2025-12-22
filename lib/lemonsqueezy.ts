import { BILLING, URLS } from "@/lib/constants";

export type LemonSqueezyCheckoutResult = {
  url: string;
};

export type LemonSqueezySubscriptionUrls = {
  customer_portal?: string;
  update_payment_method?: string;
};

export type LemonSqueezySubscription = {
  id: string;
  status: string | null;
  renews_at: string | null;
  ends_at: string | null;
  urls: LemonSqueezySubscriptionUrls | null;
  variant_id: string | null;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getLemonSqueezyConfig() {
  return {
    apiKey: requiredEnv("LEMONSQUEEZY_API_KEY"),
    storeId: requiredEnv("LEMONSQUEEZY_STORE_ID"),
    proVariantId: requiredEnv("LEMONSQUEEZY_PRO_VARIANT_ID"),
    redirectUrl: "http://localhost:3000/app",
    // process.env.LEMONSQUEEZY_CHECKOUT_REDIRECT_URL?.replace(/\/$/, "") ??
    // `${URLS.APP}/app`,
  };
}

export async function createProCheckout(params: {
  clerkUserId: string;
  email: string;
}): Promise<LemonSqueezyCheckoutResult> {
  const { apiKey, storeId, proVariantId, redirectUrl } =
    getLemonSqueezyConfig();

  const response = await fetch(
    `${BILLING.LEMONSQUEEZY.API_BASE_URL}/checkouts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            product_options: {
              redirect_url: redirectUrl, // ✅ belongs here
            },
            checkout_options: {
              // example valid options:
              // embed: true,
              // discount: false,
            },
            checkout_data: {
              email: params.email,
              custom: {
                clerk_user_id: params.clerkUserId,
                email: params.email,
              },
            },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: proVariantId } },
          },
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to create Lemon Squeezy checkout (${response.status}): ${text}`
    );
  }

  const json = (await response.json()) as unknown;
  const urlCandidate =
    (
      json as {
        data?: { attributes?: { url?: unknown; checkout_url?: unknown } };
      }
    )?.data?.attributes?.url ??
    (
      json as {
        data?: { attributes?: { url?: unknown; checkout_url?: unknown } };
      }
    )?.data?.attributes?.checkout_url;

  if (!urlCandidate || typeof urlCandidate !== "string") {
    throw new Error("Lemon Squeezy checkout URL missing in response");
  }

  return { url: urlCandidate };
}

export async function getSubscription(
  subscriptionId: string
): Promise<LemonSqueezySubscription> {
  const { apiKey } = getLemonSqueezyConfig();

  const response = await fetch(
    `${BILLING.LEMONSQUEEZY.API_BASE_URL}/subscriptions/${encodeURIComponent(
      subscriptionId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch Lemon Squeezy subscription (${response.status}): ${text}`
    );
  }

  const json = (await response.json()) as unknown;
  const data = (
    json as { data?: { id?: unknown; attributes?: Record<string, unknown> } }
  )?.data;
  const attributes = data?.attributes ?? null;
  const urls = (attributes?.["urls"] ?? null) as unknown;

  return {
    id:
      typeof data?.id === "string" || typeof data?.id === "number"
        ? String(data?.id)
        : subscriptionId,
    status:
      typeof attributes?.["status"] === "string"
        ? (attributes["status"] as string)
        : null,
    renews_at:
      typeof attributes?.["renews_at"] === "string"
        ? (attributes["renews_at"] as string)
        : null,
    ends_at:
      typeof attributes?.["ends_at"] === "string"
        ? (attributes["ends_at"] as string)
        : null,
    urls:
      urls && typeof urls === "object"
        ? {
            customer_portal:
              typeof (urls as Record<string, unknown>)["customer_portal"] ===
              "string"
                ? ((urls as Record<string, unknown>)[
                    "customer_portal"
                  ] as string)
                : undefined,
            update_payment_method:
              typeof (urls as Record<string, unknown>)[
                "update_payment_method"
              ] === "string"
                ? ((urls as Record<string, unknown>)[
                    "update_payment_method"
                  ] as string)
                : undefined,
          }
        : null,
    variant_id:
      typeof attributes?.["variant_id"] === "number" ||
      typeof attributes?.["variant_id"] === "string"
        ? String(attributes["variant_id"])
        : null,
  };
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  const { apiKey } = getLemonSqueezyConfig();

  const response = await fetch(
    `${BILLING.LEMONSQUEEZY.API_BASE_URL}/subscriptions/${encodeURIComponent(
      subscriptionId
    )}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
    }
  );

  if (response.status === 404) return;

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to cancel Lemon Squeezy subscription (${response.status}): ${text}`
    );
  }
}
