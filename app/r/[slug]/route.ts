import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LINK_STATUSES } from "@/lib/constants";
import { sendOpenedNotification } from "@/lib/email";
import { createLogger } from "@/lib/logger";

const logger = createLogger("redirect.slug");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const link = await prisma.link.findUnique({
      where: { slug },
      include: {
        user: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Check if expired
    if (link.expiresAt && link.expiresAt <= new Date()) {
      // Update status to EXPIRED if not already
      if (link.status !== LINK_STATUSES.EXPIRED) {
        await prisma.$transaction(async (tx) => {
          await tx.link.update({
            where: { id: link.id },
            data: { status: LINK_STATUSES.EXPIRED },
          });

          await tx.event.create({
            data: {
              linkId: link.id,
              type: "EXPIRED",
            },
          });
        });
      }

      return NextResponse.redirect(new URL("/expired", request.url), 302);
    }

    const now = new Date();
    const isFirstOpen = !link.firstOpenedAt;

    // Update link and create event in transaction
    await prisma.$transaction(async (tx) => {
      await tx.link.update({
        where: { id: link.id },
        data: {
          status: LINK_STATUSES.CLOSED,
          firstOpenedAt: isFirstOpen ? now : link.firstOpenedAt,
          lastOpenedAt: now,
        },
      });

      await tx.event.create({
        data: {
          linkId: link.id,
          type: "OPENED",
        },
      });
    });

    // Send notification only on first open if enabled.
    if (isFirstOpen && link.notifyOnOpen && link.user.email) {
      try {
        await sendOpenedNotification(link, link.user.email);
      } catch (error) {
        logger.error("Failed to send opened notification", {
          error,
          linkId: link.id,
          userId: link.userId,
        });
        // Don't fail the redirect if email fails.
      }
    }

    // Redirect to original URL
    return NextResponse.redirect(link.originalUrl, 302);
  } catch (error) {
    logger.error("Failed to handle redirect", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
