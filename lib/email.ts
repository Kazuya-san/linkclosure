import { Resend } from "resend";
import type { Link } from "@prisma/client";
import { EMAIL, URLS } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("email");

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Set it to send emails.');
  }
  return new Resend(apiKey);
}

const EMAIL_THEME = {
  background: "#0f1324",
  panel: "#151b31",
  panelBorder: "#283252",
  panelMuted: "#101728",
  text: "#f3f6ff",
  muted: "#9da9ca",
  primary: "#3b82f6",
  primarySoft: "#162445",
  primaryGlow: "#8ec5ff",
  success: "#8ee3b7",
} as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderDetailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 0 0 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding: 0 16px 8px; color: ${EMAIL_THEME.muted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">
              ${escapeHtml(label)}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 16px; color: ${EMAIL_THEME.text}; font-size: 14px; line-height: 1.6; word-break: break-word; overflow-wrap: anywhere;">
              ${escapeHtml(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderEmailTemplate({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaUrl,
  footer,
  details,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
  details: Array<{ label: string; value: string }>;
}) {
  const safeCtaUrl = escapeHtml(ctaUrl);
  const detailsHtml = details.map((detail) => renderDetailRow(detail.label, detail.value)).join("");

  return `
    <div style="margin:0; padding:32px 16px; background:${EMAIL_THEME.background};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; border-collapse:collapse;">
              <tr>
                <td style="padding-bottom:16px;">
                  <div style="display:inline-block; padding:8px 12px; border:1px solid ${EMAIL_THEME.panelBorder}; background:${EMAIL_THEME.panelMuted}; color:${EMAIL_THEME.muted}; font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase;">
                    Closure Links
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:linear-gradient(180deg, ${EMAIL_THEME.primarySoft} 0%, ${EMAIL_THEME.panel} 28%, ${EMAIL_THEME.panel} 100%); border:1px solid ${EMAIL_THEME.panelBorder}; padding:32px; color:${EMAIL_THEME.text}; font-family:Arial, Helvetica, sans-serif;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 10px; background:rgba(59, 130, 246, 0.14); border:1px solid rgba(142, 197, 255, 0.32); color:${EMAIL_THEME.primaryGlow}; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
                    ${escapeHtml(eyebrow)}
                  </div>
                  <h1 style="margin:0 0 12px; font-size:30px; line-height:1.15; font-weight:700; color:${EMAIL_THEME.text};">
                    ${escapeHtml(title)}
                  </h1>
                  <p style="margin:0 0 28px; font-size:15px; line-height:1.7; color:${EMAIL_THEME.muted};">
                    ${escapeHtml(description)}
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px; border-collapse:collapse;">
                    <tr>
                      <td style="border-radius:999px; background:${EMAIL_THEME.primary};">
                        <a href="${safeCtaUrl}" style="display:inline-block; padding:14px 22px; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none;">
                          ${escapeHtml(ctaLabel)}
                        </a>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; margin:0 0 18px; background:${EMAIL_THEME.panelMuted}; border:1px solid ${EMAIL_THEME.panelBorder};">
                    <tr>
                      <td style="padding:18px 0 8px;">
                        ${detailsHtml}
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0; font-size:13px; line-height:1.7; color:${EMAIL_THEME.muted};">
                    ${escapeHtml(footer)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 6px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:${EMAIL_THEME.muted};">
                  Sent by Closure Links. Built for reminders, time-sensitive links, and clear follow-through.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendReminderEmail(
  link: Link,
  recipientEmail: string
): Promise<void> {
  try {
    const resend = getResendClient();
    const shortUrl = `${URLS.APP}/r/${link.slug}`;
    const expiresAt = formatDate(link.expiresAt);

    await resend.emails.send({
      from: EMAIL.FROM,
      to: recipientEmail,
      subject: "Reminder: You have a link waiting",
      html: renderEmailTemplate({
        eyebrow: "Reminder",
        title: "A closure link is waiting for you",
        description:
          "This is a follow-up reminder for a link that has not been opened yet. Use the button below to access it before it expires.",
        ctaLabel: "Open Link",
        ctaUrl: shortUrl,
        footer:
          "If you're expecting this link, you can open it now. If not, you can safely ignore this email.",
        details: [
          { label: "Link", value: shortUrl },
          {
            label: "Expires",
            value: expiresAt ?? "No expiry set",
          },
          {
            label: "Reminder cadence",
            value: `${link.remindAfterHours} hour${link.remindAfterHours === 1 ? "" : "s"} after creation`,
          },
        ],
      }),
      text: [
        "Reminder: A closure link is waiting for you.",
        `Open link: ${shortUrl}`,
        `Expires: ${expiresAt ?? "No expiry set"}`,
      ].join("\n"),
    });
  } catch (error) {
    logger.error("Failed to send reminder email", {
      error,
      linkId: link.id,
      recipientEmail,
    });
    throw error;
  }
}

export async function sendOpenedNotification(
  link: Link,
  creatorEmail: string
): Promise<void> {
  try {
    const resend = getResendClient();
    const shortUrl = `${URLS.APP}/r/${link.slug}`;
    const openedAt = formatDate(new Date()) ?? "Just now";

    await resend.emails.send({
      from: EMAIL.FROM,
      to: creatorEmail,
      subject: "Your link was opened",
      html: renderEmailTemplate({
        eyebrow: "Opened",
        title: "Your closure link was opened",
        description:
          "Someone opened your link for the first time. This notification was sent immediately so you can follow up while the interaction is still fresh.",
        ctaLabel: "View Link",
        ctaUrl: shortUrl,
        footer:
          "You are receiving this because open notifications are enabled for this closure link.",
        details: [
          { label: "Link", value: shortUrl },
          { label: "Opened at", value: openedAt },
          {
            label: "Status",
            value: "Marked as opened in your dashboard",
          },
        ],
      }),
      text: [
        "Your closure link was opened.",
        `Link: ${shortUrl}`,
        `Opened at: ${openedAt}`,
      ].join("\n"),
    });
  } catch (error) {
    logger.error("Failed to send opened notification email", {
      error,
      linkId: link.id,
      creatorEmail,
    });
    throw error;
  }
}
