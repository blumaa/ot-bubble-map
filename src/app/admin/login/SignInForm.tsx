"use client";

import { useActionState, useId } from "react";
import { signIn, type SignInState } from "@/actions/admin";

const INITIAL: SignInState = { status: "idle" };

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const emailId = useId();
  const passwordId = useId();

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor={emailId} className="field-label">
          Email
        </label>
        <input id={emailId} type="email" name="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label htmlFor={passwordId} className="field-label">
          Password
        </label>
        <input id={passwordId} type="password" name="password" required autoComplete="current-password" className="field" />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="button-primary"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
