import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-12">
      <SignIn 
        path="/sign-in" 
        routing="path" 
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </main>
  );
}
