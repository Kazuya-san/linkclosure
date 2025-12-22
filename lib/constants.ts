import type { LinkStatus, Plan } from "@prisma/client";

export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
} as const satisfies Record<string, Plan>;

export const LINK_STATUSES = {
  HEALTHY: "HEALTHY",
  DELAYED: "DELAYED",
  AT_RISK: "AT_RISK",
  CLOSED: "CLOSED",
  EXPIRED: "EXPIRED",
} as const satisfies Record<string, LinkStatus>;

export const PRICING = {
  USD: {
    [PLANS.FREE]: 0,
    [PLANS.PRO]: 5,
  },
} as const;

export const LIMITS = {
  LINKS: {
    [PLANS.FREE]: 5,
    [PLANS.PRO]: Number.POSITIVE_INFINITY,
  },
  REMINDERS_PER_LINK: {
    [PLANS.FREE]: 1,
    [PLANS.PRO]: 2,
  },
} as const;

export const DEFAULTS = {
  REMIND_AFTER_HOURS: 48,
  LINK_STATUS: LINK_STATUSES.HEALTHY,
  NOTIFY_ON_OPEN: true,
} as const;

export const SLUG = {
  LENGTH: 10,
  MAX_GENERATION_ATTEMPTS: 10,
} as const;

export const URLS = {
  APP:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://linkclosure.com",
} as const;

export const EMAIL = {
  FROM: process.env.EMAIL_FROM_ADDRESS || "noreply@linkclosure.com",
} as const;

export const LINK_STATUS = {
  REMINDER_ELIGIBLE: [
    LINK_STATUSES.HEALTHY,
    LINK_STATUSES.DELAYED,
    LINK_STATUSES.AT_RISK,
  ] as const satisfies readonly LinkStatus[],
} as const;

export const BILLING = {
  LEMONSQUEEZY: {
    API_BASE_URL: "https://api.lemonsqueezy.com/v1",
    PROVIDER: "LEMONSQUEEZY",
  },
} as const;

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
