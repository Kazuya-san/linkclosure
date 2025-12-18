import { auth, currentUser } from "@clerk/nextjs/server";

export default async function UserInfoPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold">Server user lookup</h1>
      <p className="text-muted-foreground">
        This page is a server component reading from Clerk via{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">auth()</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">
          currentUser()
        </code>
        .
      </p>
      <div className="rounded-lg border bg-card p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">userId</dt>
            <dd className="font-mono text-base">{userId ?? "Not signed in"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono text-base">
              {email ?? "Unavailable (not signed in)"}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
