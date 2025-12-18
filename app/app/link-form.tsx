"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan } from "@prisma/client";

interface LinkFormProps {
  userPlan: Plan;
  linkCount: number;
}

export default function LinkForm({ userPlan, linkCount }: LinkFormProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [remindAfterHours, setRemindAfterHours] = useState("48");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isFreePlan = userPlan === "FREE";
  const canCreateLink = !isFreePlan || linkCount < 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl,
          recipientEmail: recipientEmail || null,
          remindAfterHours: remindAfterHours ? parseInt(remindAfterHours) : 48,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setSuccess(true);
      setOriginalUrl("");
      setRecipientEmail("");
      setRemindAfterHours("48");
      setExpiresAt("");

      // Reload page to show new link
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="originalUrl">URL *</Label>
            <Input
              id="originalUrl"
              type="url"
              placeholder="https://example.com"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              disabled={!canCreateLink || isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Must start with http:// or https://
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email (optional)</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={!canCreateLink || isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Email address to send reminders to
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remindAfterHours">Remind After (hours)</Label>
            <Input
              id="remindAfterHours"
              type="number"
              min="1"
              value={remindAfterHours}
              onChange={(e) => setRemindAfterHours(e.target.value)}
              disabled={!canCreateLink || isSubmitting}
            />
            {isFreePlan && (
              <p className="text-xs text-muted-foreground">
                FREE Plan: Maximum 1 reminder allowed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={!canCreateLink || isSubmitting}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
              Link created successfully!
            </div>
          )}

          {!canCreateLink && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              FREE Plan limit reached: Maximum 5 links allowed
            </div>
          )}

          <Button
            type="submit"
            disabled={!canCreateLink || isSubmitting || !originalUrl}
          >
            {isSubmitting ? "Creating..." : "Create Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
