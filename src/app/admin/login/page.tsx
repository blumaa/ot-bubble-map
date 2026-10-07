import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  "not-admin": "That account is not an admin.",
};

async function SignInError({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return message ? (
    <p role="alert" className="mb-3 text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-4 font-display text-2xl font-semibold">Admin sign in</h1>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <SignInForm />
    </main>
  );
}
