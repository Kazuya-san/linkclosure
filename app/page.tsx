import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  LinkIcon,
  ClockIcon,
  MailIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";

const features = [
  {
    icon: LinkIcon,
    title: "Smart Links",
    description:
      "Create unique, trackable links with custom slugs and expiration dates.",
  },
  {
    icon: ClockIcon,
    title: "Auto Expiration",
    description: "Links automatically expire at your specified date and time.",
  },
  {
    icon: MailIcon,
    title: "Email Reminders",
    description:
      "Send automated reminders and get notified the moment links are opened.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Status Tracking",
    description:
      "Monitor link health with real-time status updates (Healthy, Delayed, At Risk, Closed).",
  },
  {
    icon: CheckCircle2Icon,
    title: "Open Tracking",
    description:
      "Know exactly when your links are opened with timestamp tracking.",
  },
  {
    icon: SparklesIcon,
    title: "Free Plan",
    description:
      "Start with 5 free links, 1 reminder per link, and all core features.",
  },
];

export default async function LandingPage() {
  // Middleware handles redirect for authenticated users
  // This page is only accessible to unauthenticated users

  return (
    <div className="bg-background text-foreground">
      {/* Background accents */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-120px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[380px] w-[380px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      {/* Page wrapper */}
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <main className="flex-1">
          {/* Hero */}
          <section className="py-14 sm:py-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-2 text-sm shadow-sm">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-muted-foreground">
                  Link closure management, redesigned
                </span>
              </div>

              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                Get closure on{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  your links
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
                Create smart links that expire, send reminders, and notify you
                when opened. Perfect for time-sensitive content and closure
                tracking.
              </p>

              <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
              <div className="mt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/pricing">View Pricing →</Link>
                </Button>
              </div>

              {/* Mini proof row */}
              <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-card/60 p-4 text-center shadow-sm">
                  <div className="text-2xl font-semibold">5</div>
                  <div className="text-sm text-muted-foreground">
                    Free links
                  </div>
                </div>
                <div className="rounded-2xl border bg-card/60 p-4 text-center shadow-sm">
                  <div className="text-2xl font-semibold">1-click</div>
                  <div className="text-sm text-muted-foreground">Setup</div>
                </div>
                <div className="rounded-2xl border bg-card/60 p-4 text-center shadow-sm">
                  <div className="text-2xl font-semibold">Realtime</div>
                  <div className="text-sm text-muted-foreground">
                    Open alerts
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-5xl">
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  Everything you need
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Powerful features to manage closure links end-to-end.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <Card
                      key={f.title}
                      className="group relative overflow-hidden border bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50"
                    >
                      {/* subtle hover glow */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-primary/15 blur-2xl" />
                      </div>

                      <CardHeader>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/60 shadow-sm">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{f.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {f.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="pb-16 sm:pb-24">
            <div className="mx-auto max-w-5xl">
              <Card className="relative overflow-hidden border bg-gradient-to-b from-primary/10 to-background shadow-sm">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                >
                  <div className="absolute left-1/2 top-[-120px] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
                </div>

                <CardHeader className="text-center">
                  <CardTitle className="text-3xl sm:text-4xl">
                    Ready to get started?
                  </CardTitle>
                  <CardDescription className="mx-auto mt-2 max-w-2xl text-base sm:text-lg">
                    Create your first closure link in seconds and get notified
                    the moment it's opened.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center justify-center gap-3 pb-8 sm:flex-row">
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link href="/sign-up">
                      Get Started Free
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <Link href="/sign-in">I already have an account</Link>
                  </Button>
                </CardContent>
              </Card>

              <footer className="mt-10 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Closure Links. All rights
                  reserved.
                </p>
              </footer>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
