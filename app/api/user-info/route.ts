import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  return NextResponse.json(
    {
      userId,
      email,
      signedIn: Boolean(userId),
    },
    {
      status: 200,
    }
  );
}
