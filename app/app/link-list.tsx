"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, CheckIcon, ExternalLinkIcon, CalendarIcon, MailIcon } from "lucide-react";
import { toast } from "sonner";
import type { Link } from "@prisma/client";
import { format } from "date-fns";

interface LinkListProps {
  initialLinks: Link[];
}

function getStatusVariant(
  status: Link["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "HEALTHY":
      return "default";
    case "DELAYED":
      return "secondary";
    case "AT_RISK":
      return "destructive";
    case "CLOSED":
      return "outline";
    case "EXPIRED":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: Link["status"]): string {
  return status.replace("_", " ");
}

export default function LinkList({ initialLinks }: LinkListProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success("Link copied to clipboard!", {
      description: url,
    });
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (initialLinks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <CopyIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No links yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first closure link to get started. It only takes a
                few seconds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {initialLinks.map((link) => {
        const smartLink = `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/r/${link.slug}`;
        const isOpened = !!link.firstOpenedAt;

        return (
          <Card key={link.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {link.originalUrl}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      asChild
                    >
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(link.status)}>
                      {getStatusLabel(link.status)}
                    </Badge>
                    {isOpened && (
                      <Badge variant="outline" className="text-xs">
                        Opened
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Smart Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={smartLink}
                    className="font-mono text-xs bg-muted"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(link.slug)}
                    className="shrink-0"
                  >
                    {copiedSlug === link.slug ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span className="font-medium">Created</span>
                  </div>
                  <div className="text-foreground">
                    {format(new Date(link.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="text-muted-foreground">
                    {format(new Date(link.createdAt), "HH:mm")}
                  </div>
                </div>
                {link.firstOpenedAt && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckIcon className="h-3 w-3" />
                      <span className="font-medium">First Opened</span>
                    </div>
                    <div className="text-foreground">
                      {format(new Date(link.firstOpenedAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(link.firstOpenedAt), "HH:mm")}
                    </div>
                  </div>
                )}
                {link.expiresAt && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span className="font-medium">Expires</span>
                    </div>
                    <div className="text-foreground">
                      {format(new Date(link.expiresAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(link.expiresAt), "HH:mm")}
                    </div>
                  </div>
                )}
                {link.recipientEmail && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MailIcon className="h-3 w-3" />
                      <span className="font-medium">Recipient</span>
                    </div>
                    <div className="text-foreground truncate">
                      {link.recipientEmail}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
