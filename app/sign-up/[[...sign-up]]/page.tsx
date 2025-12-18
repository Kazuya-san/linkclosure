import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-12">
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in"
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
