import { Resend } from "resend";
import type { Link } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "noreply@linkclosure.com";

export async function sendReminderEmail(
  link: Link,
  recipientEmail: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: "Reminder: You have a link waiting",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reminder</h2>
          <p>You have a link waiting for you. Click the link below to access it:</p>
          <p><a href="${
            process.env.NEXT_PUBLIC_APP_URL || "https://linkclosure.com"
          }/r/${link.slug}" style="color: #0066cc;">Open Link</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">This is an automated reminder from LinkClosure.</p>
        </div>
      `,
      text: `Reminder: You have a link waiting. Open it here: ${
        process.env.NEXT_PUBLIC_APP_URL || "https://linkclosure.com"
      }/r/${link.slug}`,
    });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    throw error;
  }
}

export async function sendOpenedNotification(
  link: Link,
  creatorEmail: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: "Your link was opened",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Link Opened</h2>
          <p>Your link has been opened.</p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">This is an automated notification from LinkClosure.</p>
        </div>
      `,
      text: `Your link has been opened.`,
    });
  } catch (error) {
    console.error("Failed to send opened notification:", error);
    throw error;
  }
}
