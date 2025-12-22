import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createProCheckout } from "@/lib/lemonsqueezy";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null;

    if (!email) {
      return NextResponse.json(
        { error: "Missing email address" },
        { status: 400 }
      );
    }

    const { url } = await createProCheckout({ clerkUserId: userId, email });
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

