"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, CheckIcon } from "lucide-react";
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
  const [links] = useState(initialLinks);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = async (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No links yet. Create your first link above.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {links.map((link) => {
        const smartLink = `${
          typeof window !== "undefined" ? window.location.origin : ""
        }/r/${link.slug}`;
        const isOpened = !!link.firstOpenedAt;

        return (
          <Card key={link.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">
                    {link.originalUrl}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getStatusVariant(link.status)}>
                      {getStatusLabel(link.status)}
                    </Badge>
                    {isOpened && <Badge variant="outline">Opened</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={smartLink}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(link.slug)}
                  >
                    {copiedSlug === link.slug ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium">Created</div>
                  <div>
                    {format(new Date(link.createdAt), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
                {link.firstOpenedAt && (
                  <div>
                    <div className="font-medium">First Opened</div>
                    <div>
                      {format(
                        new Date(link.firstOpenedAt),
                        "MMM d, yyyy HH:mm"
                      )}
                    </div>
                  </div>
                )}
                {link.expiresAt && (
                  <div>
                    <div className="font-medium">Expires</div>
                    <div>
                      {format(new Date(link.expiresAt), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                )}
                {link.recipientEmail && (
                  <div>
                    <div className="font-medium">Recipient</div>
                    <div className="truncate">{link.recipientEmail}</div>
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
