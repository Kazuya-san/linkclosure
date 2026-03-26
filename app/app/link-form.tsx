"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { CalendarIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";
import { DEFAULTS, LIMITS, PLANS, SLUG } from "@/lib/constants";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface LinkFormProps {
  userPlan: Plan;
  linkCount: number;
  onSuccess?: (result: CreateLinkSuccess) => void;
}

export interface CreateLinkSuccess {
  slug: string;
  shortUrl: string;
}

/**
 * NOTE ABOUT TYPE ERRORS YOU SAW:
 * If you still see "Zod3Type" / "_zod.version.minor" mismatch errors,
 * you have zod v4 + resolvers expecting zod v3 (or duplicated zod versions).
 * Fix by aligning versions:
 *   - zod@^4 and @hookform/resolvers@^3 (recommended), dedupe lockfile.
 */

// ---- Stable schema shape (Zod v4-friendly) ----
// Keep the shape stable so we can infer FormValues once.
const linkSchema = z.object({
  originalUrl: z
    .url("Enter a valid URL")
    .trim()
    .min(1, "Destination URL is required")
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),

  // React inputs naturally produce "" for empty; treat "" as "not provided".
  recipientEmail: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address",
    })
    .default(""),

  customSlug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (v) =>
        v === "" ||
        (v.length >= SLUG.CUSTOM.MIN_LENGTH &&
          v.length <= SLUG.CUSTOM.MAX_LENGTH),
      {
        message: `Slug must be ${SLUG.CUSTOM.MIN_LENGTH}-${SLUG.CUSTOM.MAX_LENGTH} characters`,
      }
    )
    .refine((v) => v === "" || SLUG.CUSTOM.REGEX.test(v), {
      message: "Slug can only include letters, numbers, '-' and '_'",
    })
    .refine((v) => v === "" || !SLUG.CUSTOM.RESERVED.has(v), {
      message: "This slug is reserved",
    })
    .default(""),

  remindAfterHours: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1 hour")
    .default(DEFAULTS.REMIND_AFTER_HOURS),

  expiresAtDate: z.date().optional(),
  // Keep as string (never undefined) so Select value doesn't get string|undefined.
  expiresAtTime: z.string().default(""),
});

type FormValues = z.infer<typeof linkSchema>;

// ---- Add plan + cross-field checks without changing the inferred type ----
function buildResolverSchema(isPro: boolean) {
  return linkSchema.superRefine((data, ctx) => {
    // PRO gating
    if (!isPro && data.customSlug !== "") {
      ctx.addIssue({
        code: "custom",
        path: ["customSlug"],
        message: "Custom slugs are available on PRO only",
      });
    }

    // Expiry must be in the future (if date is set)
    if (!data.expiresAtDate) return;

    const now = new Date();
    const dateTime = new Date(data.expiresAtDate);

    if (data.expiresAtTime) {
      const [h, m] = data.expiresAtTime.split(":");
      dateTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    } else {
      // If no time selected, use end of day
      dateTime.setHours(23, 59, 59, 0);
    }

    if (dateTime <= now) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAtDate"],
        message: "Expiry must be in the future",
      });
    }
  });
}

export default function LinkForm({
  userPlan,
  linkCount,
  onSuccess,
}: LinkFormProps) {
  const isFreePlan = userPlan === PLANS.FREE;
  const isPro = !isFreePlan;

  const canCreateLink = !isFreePlan || linkCount < LIMITS.LINKS[PLANS.FREE];

  const timeOptions = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? "AM" : "PM";
        const value = `${hour.toString().padStart(2, "0")}:${minute}`;
        const label = `${hour12}:${minute} ${ampm}`;
        return { value, label };
      }),
    []
  );

  const resolverSchema = useMemo(() => buildResolverSchema(isPro), [isPro]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resolverSchema),
    defaultValues: {
      originalUrl: "",
      recipientEmail: "",
      customSlug: "",
      remindAfterHours: DEFAULTS.REMIND_AFTER_HOURS,
      expiresAtDate: undefined,
      expiresAtTime: "",
    },
  });

  const expiresAtDate = watch("expiresAtDate");
  const expiresAtTime = watch("expiresAtTime"); // always string (default "")
  const originalUrl = watch("originalUrl");

  const onSubmit = async (values: FormValues) => {
    try {
      // Combine date + time into expiresAt ISO string for API
      let expiresAt: string | null = null;

      if (values.expiresAtDate) {
        const dateTime = new Date(values.expiresAtDate);

        if (values.expiresAtTime) {
          const [h, m] = values.expiresAtTime.split(":");
          dateTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        } else {
          dateTime.setHours(23, 59, 59, 0);
        }

        expiresAt = dateTime.toISOString();
      }

      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: values.originalUrl,
          slug: values.customSlug ? values.customSlug : null,
          recipientEmail: values.recipientEmail ? values.recipientEmail : null,
          remindAfterHours: values.remindAfterHours,
          expiresAt,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" && data && "error" in data
            ? String(
                (data as { error?: unknown }).error ?? "Failed to create link"
              )
            : "Failed to create link";
        throw new Error(message);
      }

      const slug =
        typeof data === "object" && data && "slug" in data
          ? String((data as { slug?: unknown }).slug ?? "")
          : "";

      if (!slug) {
        throw new Error("Link created, but the response was missing the slug.");
      }

      const shortUrl = `${window.location.origin}/r/${slug}`;

      reset({
        originalUrl: "",
        recipientEmail: "",
        customSlug: "",
        remindAfterHours: DEFAULTS.REMIND_AFTER_HOURS,
        expiresAtDate: undefined,
        expiresAtTime: "",
      });

      if (onSuccess) {
        onSuccess({ slug, shortUrl });
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.error("Failed to create link", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="originalUrl">Destination URL *</Label>
        <Input
          id="originalUrl"
          type="url"
          placeholder="https://example.com"
          {...register("originalUrl")}
          required
          disabled={!canCreateLink || isSubmitting}
          className="h-9"
          aria-invalid={!!errors.originalUrl}
        />
        {errors.originalUrl?.message && (
          <p className="text-xs text-destructive">
            {errors.originalUrl.message}
          </p>
        )}
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
            {...register("recipientEmail")}
            disabled={!canCreateLink || isSubmitting}
            className="h-9"
            aria-invalid={!!errors.recipientEmail}
          />
          {errors.recipientEmail?.message && (
            <p className="text-xs text-destructive">
              {errors.recipientEmail.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Who should receive reminders
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remindAfterHours">Remind After</Label>
          <Input
            id="remindAfterHours"
            type="number"
            min={1}
            {...register("remindAfterHours")}
            disabled={!canCreateLink || isSubmitting}
            className="h-9"
            aria-invalid={!!errors.remindAfterHours}
          />
          {errors.remindAfterHours?.message && (
            <p className="text-xs text-destructive">
              {errors.remindAfterHours.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {isFreePlan
              ? `Hours (max ${LIMITS.REMINDERS_PER_LINK[PLANS.FREE]} reminder)`
              : "Hours"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customSlug">
          Custom Slug {isFreePlan ? "(PRO)" : ""}
        </Label>
        <InputGroup data-disabled={!canCreateLink || isSubmitting}>
          <InputGroupAddon>/r/</InputGroupAddon>
          <InputGroupInput
            id="customSlug"
            placeholder={
              isFreePlan ? "Upgrade for custom slugs" : "my-custom-slug"
            }
            disabled={!canCreateLink || isSubmitting || isFreePlan}
            aria-invalid={!!errors.customSlug}
            {...register("customSlug")}
          />
        </InputGroup>
        {errors.customSlug?.message && (
          <p className="text-xs text-destructive">
            {errors.customSlug.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional. {SLUG.CUSTOM.MIN_LENGTH}-{SLUG.CUSTOM.MAX_LENGTH} chars;
          letters/numbers/dash/underscore.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Expiry Date &amp; Time</Label>
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
                onSelect={(date) =>
                  setValue("expiresAtDate", date ?? undefined, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={expiresAtTime}
            onValueChange={(value) =>
              setValue("expiresAtTime", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
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

        {errors.expiresAtDate?.message && (
          <p className="text-xs text-destructive">
            {errors.expiresAtDate.message}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          When this link should expire (optional)
        </p>
      </div>

      {!canCreateLink && (
        <Alert variant="destructive">
          <AlertDescription>
            FREE Plan limit reached.{" "}
            <UpgradeToProButton
              variant="link"
              className="h-auto p-0 underline underline-offset-2"
            >
              Upgrade to PRO
            </UpgradeToProButton>{" "}
            to create more links.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={!canCreateLink || isSubmitting || !originalUrl}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Creating link...
            </>
          ) : (
            "Create Link"
          )}
        </Button>
      </div>
    </form>
  );
}
