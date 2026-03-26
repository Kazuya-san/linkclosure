"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LinkForm from "./link-form";
import { Loader2Icon, PlusIcon } from "lucide-react";
import type { Plan } from "@prisma/client";

interface CreateLinkButtonProps {
  userPlan: Plan;
  linkCount: number;
}

export default function CreateLinkButton({
  userPlan,
  linkCount,
}: CreateLinkButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [expectedLinkCount, setExpectedLinkCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isRefreshingList || expectedLinkCount == null) {
      return;
    }

    if (linkCount >= expectedLinkCount) {
      const closeTimer = window.setTimeout(() => {
        setOpen(false);
        setIsRefreshingList(false);
        setExpectedLinkCount(null);
      }, 0);

      return () => window.clearTimeout(closeTimer);
    }
  }, [expectedLinkCount, isRefreshingList, linkCount]);

  const handleSuccess = () => {
    setIsRefreshingList(true);
    setExpectedLinkCount(linkCount + 1);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && (isRefreshingList || isPending)) {
          return;
        }

        setOpen(nextOpen);
        if (!nextOpen) {
          setIsRefreshingList(false);
          setExpectedLinkCount(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="default" className="w-full sm:w-auto" disabled={isRefreshingList || isPending}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isRefreshingList ? "Adding Link" : "Create New Closure Link"}</DialogTitle>
          <DialogDescription>
            {isRefreshingList
              ? "Saving your link and updating the dashboard."
              : "Create a smart link that expires, sends reminders, and notifies you when opened."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isRefreshingList ? (
            <div className="border border-border bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Updating links</p>
                  <p className="text-sm text-muted-foreground">
                    The dialog will close as soon as the new link appears in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <LinkForm
              userPlan={userPlan}
              linkCount={linkCount}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
