import { BILLING, URLS } from "@/lib/constants";

export type LemonSqueezyCheckoutResult = {
  url: string;
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
  console.log(
    "Creating Lemon Squeezy checkout for user:",
    apiKey,
    storeId,
    proVariantId,
    redirectUrl,
    params
  );

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
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(proVariantId) } },
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

  const json: unknown = await response.json();
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
