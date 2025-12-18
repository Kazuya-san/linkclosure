import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import Header from "@/components/header";
import { Toaster } from "sonner";

const nunitoSans = Nunito_Sans({ variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkClosure - Get Closure on Your Links",
  description:
    "Create smart links that expire, send reminders, and notify you when opened.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <ClerkProvider
        appearance={{
          baseTheme: shadcn,
        }}
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        >
          <Header />
          {children}
          <Toaster position="top-right" />
        </body>
      </ClerkProvider>
    </html>
  );
}
