import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClockIcon, HomeIcon } from "lucide-react";

export default function ExpiredPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ClockIcon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Link Expired</CardTitle>
          <CardDescription className="text-base">
            This link has expired and is no longer available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            The closure link you&apos;re trying to access has passed its expiration date.
            If you need access, please contact the link creator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
