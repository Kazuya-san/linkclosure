"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";

export function BillingActions(props: { isPro: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  const openCustomerPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as unknown;
      const urlCandidate =
        typeof (data as { subscription?: { urls?: { customer_portal?: unknown } } })
          ?.subscription?.urls?.customer_portal === "string"
          ? ((data as { subscription?: { urls?: { customer_portal?: unknown } } })
              ?.subscription?.urls?.customer_portal as string)
          : null;

      if (!response.ok || !urlCandidate) {
        const errorMessage =
          typeof (data as { error?: unknown })?.error === "string"
            ? ((data as { error?: unknown }).error as string)
            : "Customer portal is not available";
        throw new Error(
          errorMessage
        );
      }

      window.location.assign(urlCandidate);
    } catch (error) {
      toast.error("Could not open billing portal", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json().catch(() => null)) as unknown;
      const ok = Boolean((data as { ok?: unknown })?.ok);
      if (!response.ok || !ok) {
        const errorMessage =
          typeof (data as { error?: unknown })?.error === "string"
            ? ((data as { error?: unknown }).error as string)
            : "Failed to cancel subscription";
        throw new Error(errorMessage);
      }
      const message =
        typeof (data as { message?: unknown })?.message === "string"
          ? ((data as { message?: unknown }).message as string)
          : null;
      toast.success("Cancellation requested", {
        description:
          message ||
          "Your plan will update after Lemon Squeezy processes the change.",
      });
    } catch (error) {
      toast.error("Cancel failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!props.isPro) {
    return (
      <div className="pt-2">
        <UpgradeToProButton className="w-full">Upgrade to PRO</UpgradeToProButton>
      </div>
    );
  }

  return (
    <div className="grid gap-2 pt-2 sm:grid-cols-2">
      <Button
        variant="outline"
        onClick={openCustomerPortal}
        disabled={isLoading}
      >
        Manage subscription
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isLoading}>
            Switch to Free
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This requests a cancellation in Lemon Squeezy. Your access may
              remain active until the end of your billing period. Plan changes
              are applied only via verified webhooks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Pro</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>Cancel subscription</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
