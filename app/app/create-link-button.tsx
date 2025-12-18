"use client";

import { useState } from "react";
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
import { PlusIcon } from "lucide-react";
import type { Plan } from "@prisma/client";

interface CreateLinkButtonProps {
  userPlan: Plan;
  linkCount: number;
}

export default function CreateLinkButton({
  userPlan,
  linkCount,
}: CreateLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const isFreePlan = userPlan === "FREE";
  const canCreateLink = !isFreePlan || linkCount < 5;

  const handleSuccess = () => {
    setOpen(false);
    // Small delay to let the toast show, then reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="default" className="w-full sm:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Create New Closure Link</DialogTitle>
          <DialogDescription>
            Create a smart link that expires, sends reminders, and notifies you
            when opened.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <LinkForm
            userPlan={userPlan}
            linkCount={linkCount}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

