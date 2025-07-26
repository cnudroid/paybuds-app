import { UserAuthForm } from "@/components/user-auth-form";
import Link from "next/link";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="container mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground">
          Click the button below to sign in with your Google account.
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <UserAuthForm />
      </Suspense>
      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
