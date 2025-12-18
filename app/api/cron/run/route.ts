import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let expiredCount = 0;
    let reminderCount = 0;
    let statusUpdateCount = 0;

    // Expire links
    const linksToExpire = await prisma.link.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: {
          not: "EXPIRED",
        },
      },
    });

    for (const link of linksToExpire) {
      await prisma.$transaction(async (tx) => {
        await tx.link.update({
          where: { id: link.id },
          data: { status: "EXPIRED" },
        });

        await tx.event.create({
          data: {
            linkId: link.id,
            type: "EXPIRED",
          },
        });
      });
      expiredCount++;
    }

    // Find links due for reminders
    // First get all eligible links, then filter by time logic
    const eligibleLinks = await prisma.link.findMany({
      where: {
        status: {
          in: ["HEALTHY", "DELAYED", "AT_RISK"],
        },
        recipientEmail: {
          not: null,
        },
        firstOpenedAt: null, // Only remind for unopened links
      },
      include: {
        user: true,
      },
    });

    // Filter links where remindersSent < maxReminders and reminder is due
    const linksDueForReminder = eligibleLinks.filter((link) => {
      if (link.remindersSent >= link.maxReminders) return false;
      if (!link.recipientEmail) return false;
      
      // Skip if link is expired
      if (link.expiresAt && link.expiresAt <= now) return false;

      const remindAfter = new Date(link.createdAt);
      remindAfter.setHours(remindAfter.getHours() + link.remindAfterHours);

      return remindAfter <= now;
    });

    for (const link of linksDueForReminder) {
      const remindAfter = new Date(link.createdAt);
      remindAfter.setHours(remindAfter.getHours() + link.remindAfterHours);

      // Check if reminder is due
      if (remindAfter <= now && link.recipientEmail) {
        try {
          await sendReminderEmail(link, link.recipientEmail);

          await prisma.$transaction(async (tx) => {
            await tx.link.update({
              where: { id: link.id },
              data: {
                remindersSent: link.remindersSent + 1,
              },
            });

            await tx.event.create({
              data: {
                linkId: link.id,
                type: "REMINDER_SENT",
              },
            });
          });

          reminderCount++;
        } catch (error) {
          console.error(`Failed to send reminder for link ${link.id}:`, error);
          // Continue with other links
        }
      }
    }

    // Update link statuses based on reminders and opened state
    const linksToUpdateStatus = await prisma.link.findMany({
      where: {
        status: {
          in: ["HEALTHY", "DELAYED", "AT_RISK"],
        },
        firstOpenedAt: null,
      },
    });

    for (const link of linksToUpdateStatus) {
      let newStatus: "HEALTHY" | "DELAYED" | "AT_RISK" = "HEALTHY";

      if (link.remindersSent >= link.maxReminders) {
        newStatus = "AT_RISK";
      } else if (link.remindersSent > 0) {
        newStatus = "DELAYED";
      }

      if (link.status !== newStatus) {
        await prisma.link.update({
          where: { id: link.id },
          data: { status: newStatus },
        });
        statusUpdateCount++;
      }
    }

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      remindersSent: reminderCount,
      statusUpdates: statusUpdateCount,
    });
  } catch (error) {
    console.error("Error running cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

