"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UpgradeToProButton(props: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  children?: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const startCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      window.location.assign(data.url);
    } catch (error) {
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={props.className}
      size={props.size}
      variant={props.variant}
      onClick={startCheckout}
      disabled={isLoading}
    >
      {props.children ?? (isLoading ? "Redirecting..." : "Upgrade to PRO")}
    </Button>
  );
}

