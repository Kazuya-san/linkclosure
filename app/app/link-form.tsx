"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";

interface LinkFormProps {
  userPlan: Plan;
  linkCount: number;
  onSuccess?: () => void;
}

export default function LinkForm({
  userPlan,
  linkCount,
  onSuccess,
}: LinkFormProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [remindAfterHours, setRemindAfterHours] = useState("48");
  const [expiresAtDate, setExpiresAtDate] = useState<Date | undefined>(
    undefined
  );
  const [expiresAtTime, setExpiresAtTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreePlan = userPlan === "FREE";
  const canCreateLink = !isFreePlan || linkCount < 5;

  // Generate time options
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    const value = `${hour.toString().padStart(2, "0")}:${minute}`;
    const label = `${hour12}:${minute} ${ampm}`;
    return { value, label };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time if both are set
      let expiresAt: string | null = null;
      if (expiresAtDate) {
        if (expiresAtTime) {
          const [hours, minutes] = expiresAtTime.split(":");
          const dateTime = new Date(expiresAtDate);
          dateTime.setHours(parseInt(hours), parseInt(minutes));
          expiresAt = dateTime.toISOString();
        } else {
          // If no time selected, use end of day
          const dateTime = new Date(expiresAtDate);
          dateTime.setHours(23, 59, 59);
          expiresAt = dateTime.toISOString();
        }
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl,
          recipientEmail: recipientEmail || null,
          remindAfterHours: remindAfterHours ? parseInt(remindAfterHours) : 48,
          expiresAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      toast.success("Link created successfully!", {
        description: "Your closure link is ready to share.",
      });

      setOriginalUrl("");
      setRecipientEmail("");
      setRemindAfterHours("48");
      setExpiresAtDate(undefined);
      setExpiresAtTime("");

      // Call onSuccess callback if provided (for dialog)
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise reload page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err) {
      toast.error("Failed to create link", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="originalUrl">Destination URL *</Label>
        <Input
          id="originalUrl"
          type="url"
          placeholder="https://example.com"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
          disabled={!canCreateLink || isSubmitting}
          className="h-9"
        />
        <p className="text-xs text-muted-foreground">
          The URL your closure link will redirect to
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recipientEmail">Recipient Email</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={!canCreateLink || isSubmitting}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            Who should receive reminders
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remindAfterHours">Remind After</Label>
          <Input
            id="remindAfterHours"
            type="number"
            min="1"
            value={remindAfterHours}
            onChange={(e) => setRemindAfterHours(e.target.value)}
            disabled={!canCreateLink || isSubmitting}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            {isFreePlan ? "Hours (max 1 reminder)" : "Hours"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Expiry Date & Time</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal",
                  !expiresAtDate && "text-muted-foreground"
                )}
                disabled={!canCreateLink || isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAtDate ? (
                  format(expiresAtDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAtDate}
                onSelect={setExpiresAtDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={expiresAtTime}
            onValueChange={setExpiresAtTime}
            disabled={!canCreateLink || isSubmitting || !expiresAtDate}
          >
            <SelectTrigger className="h-9 w-full">
              <div className="flex items-center">
                <ClockIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          When this link should expire (optional)
        </p>
      </div>

      {!canCreateLink && (
        <Alert variant="destructive">
          <AlertDescription>
            FREE Plan limit reached.{" "}
            <a
              href="/pricing"
              className="underline hover:no-underline"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/pricing";
              }}
            >
              Upgrade to PRO
            </a>{" "}
            to create unlimited links.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={!canCreateLink || isSubmitting || !originalUrl}
          className="flex-1"
        >
          {isSubmitting ? "Creating..." : "Create Link"}
        </Button>
      </div>
    </form>
  );
}
