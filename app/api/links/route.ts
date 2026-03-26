import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { DEFAULTS, LIMITS, PLANS, REGEX, SLUG } from "@/lib/constants";
import { ensureCurrentUserRecord } from "@/lib/current-user";
import { assertSameOriginOrNoOrigin, SecurityError } from "@/lib/security";

function normalizeCustomSlug(input: string): string {
  return input.trim().toLowerCase();
}

function validateCustomSlug(slug: string): string | null {
  if (
    slug.length < SLUG.CUSTOM.MIN_LENGTH ||
    slug.length > SLUG.CUSTOM.MAX_LENGTH
  ) {
    return `Slug must be ${SLUG.CUSTOM.MIN_LENGTH}-${SLUG.CUSTOM.MAX_LENGTH} characters`;
  }
  if (!SLUG.CUSTOM.REGEX.test(slug)) {
    return "Slug can only include letters, numbers, '-' and '_'";
  }
  if (SLUG.CUSTOM.RESERVED.has(slug)) {
    return "This slug is reserved";
  }
  return null;
}

async function generateUniqueSlug(): Promise<string> {
  let slug: string;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < SLUG.MAX_GENERATION_ATTEMPTS) {
    slug = nanoid(SLUG.LENGTH);
    const existing = await prisma.link.findUnique({
      where: { slug },
    });
    exists = !!existing;
    attempts++;
  }

  if (exists) {
    throw new Error("Failed to generate unique slug");
  }

  return slug!;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalUrl: true,
        slug: true,
        status: true,
        firstOpenedAt: true,
        lastOpenedAt: true,
        expiresAt: true,
        createdAt: true,
        recipientEmail: true,
        remindAfterHours: true,
        maxReminders: true,
        remindersSent: true,
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertSameOriginOrNoOrigin();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      originalUrl,
      slug: customSlug,
      recipientEmail,
      remindAfterHours,
      expiresAt,
    } = body;

    // Validate URL
    if (!originalUrl || typeof originalUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    // Get user to check plan
    const user = await ensureCurrentUserRecord();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check FREE plan limits
    if (user.plan === PLANS.FREE) {
      const linkCount = await prisma.link.count({
        where: { userId },
      });

      if (linkCount >= LIMITS.LINKS[PLANS.FREE]) {
        return NextResponse.json(
          {
            error: `FREE plan limit: Maximum ${
              LIMITS.LINKS[PLANS.FREE]
            } links allowed`,
          },
          { status: 403 }
        );
      }

      // FREE plan: no custom slug allowed
      if (customSlug) {
        return NextResponse.json(
          { error: "FREE plan: Custom slugs are not allowed" },
          { status: 403 }
        );
      }
    }

    // Determine slug
    const slug = customSlug
      ? normalizeCustomSlug(String(customSlug))
      : await generateUniqueSlug();

    // Check slug uniqueness if custom
    if (customSlug) {
      const validationError = validateCustomSlug(slug);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      const existing = await prisma.link.findUnique({
        where: { slug },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 409 }
        );
      }
    }

    // Validate recipient email if provided
    if (recipientEmail && typeof recipientEmail === "string") {
      if (!REGEX.EMAIL.test(recipientEmail)) {
        return NextResponse.json(
          { error: "Invalid recipient email" },
          { status: 400 }
        );
      }
    }

    // Set FREE plan defaults
    const maxReminders =
      user.plan === PLANS.FREE
        ? LIMITS.REMINDERS_PER_LINK[PLANS.FREE]
        : (() => {
            const requested =
              typeof body.maxReminders === "number" ? body.maxReminders : null;
            const maxAllowed = LIMITS.REMINDERS_PER_LINK[PLANS.PRO];
            const normalized = requested == null ? maxAllowed : requested;
            const clamped = Math.min(Math.max(normalized, 1), maxAllowed);
            return clamped;
          })();

    const parsedRemindAfterHours = Number.isFinite(remindAfterHours)
      ? remindAfterHours
      : remindAfterHours
      ? Number(remindAfterHours)
      : NaN;

    if (!Number.isNaN(parsedRemindAfterHours) && parsedRemindAfterHours < 1) {
      return NextResponse.json(
        { error: "remindAfterHours must be at least 1" },
        { status: 400 }
      );
    }

    const defaultRemindAfterHours =
      (Number.isNaN(parsedRemindAfterHours)
        ? undefined
        : parsedRemindAfterHours) ?? DEFAULTS.REMIND_AFTER_HOURS;

    // Parse expiresAt if provided
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date" },
          { status: 400 }
        );
      }
      if (expiresAtDate <= new Date()) {
        return NextResponse.json(
          { error: "Expiry must be in the future" },
          { status: 400 }
        );
      }
    }

    // Create link and event in transaction (handle races on auto-slug)
    const createOnce = async (finalSlug: string) =>
      prisma.$transaction(async (tx) => {
        const link = await tx.link.create({
          data: {
            userId,
            originalUrl,
            slug: finalSlug,
            recipientEmail: recipientEmail || null,
            remindAfterHours: defaultRemindAfterHours,
            maxReminders,
            expiresAt: expiresAtDate,
          },
        });

        await tx.event.create({
          data: {
            linkId: link.id,
            type: "CREATED",
          },
        });

        return link;
      });

    let result;
    if (customSlug) {
      try {
        result = await createOnce(slug);
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: unknown }).code === "P2002"
        ) {
          return NextResponse.json(
            { error: "Slug already exists" },
            { status: 409 }
          );
        }
        throw error;
      }
    } else {
      let attempts = 0;
      // Rare: generated slug collides due to race; retry a few times.
      while (attempts < SLUG.MAX_GENERATION_ATTEMPTS) {
        const candidate = attempts === 0 ? slug : await generateUniqueSlug();
        try {
          result = await createOnce(candidate);
          break;
        } catch (error: unknown) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: unknown }).code === "P2002"
          ) {
            attempts++;
            continue;
          }
          throw error;
        }
      }

      if (!result) {
        return NextResponse.json(
          { error: "Failed to generate unique slug" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SecurityError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
