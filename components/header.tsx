"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkIcon, HomeIcon } from "lucide-react";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
        "hover:bg-muted/70",
        active ? "bg-muted text-foreground" : "text-muted-foreground",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const onApp = pathname?.startsWith("/app");
  const onPricing = pathname === "/pricing";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* subtle top fade for modern feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background/70 to-transparent"
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/60 shadow-sm">
              <LinkIcon className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              LinkClosure
            </span>
          </Link>

          {isSignedIn && (
            <nav className="ml-1 hidden items-center gap-2 sm:flex">
              <NavLink href="/app" active={!!onApp}>
                <HomeIcon className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/pricing" active={!!onPricing}>
                Pricing
              </NavLink>
            </nav>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              {/* Optional: add a "New Link" button later */}
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
