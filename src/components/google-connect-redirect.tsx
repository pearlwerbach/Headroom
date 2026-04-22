"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export function GoogleConnectRedirect() {
  useEffect(() => {
    void signIn("google", { callbackUrl: "/auth/google/complete" });
  }, []);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-xl items-center justify-center px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Google Calendar
        </p>
        <h1 className="font-serif text-3xl text-slate-900">
          Connecting your calendar
        </h1>
        <p className="text-sm leading-7 text-slate-600">
          We&apos;re opening Google sign-in and will return you to Settings when the connection is complete.
        </p>
      </div>
    </div>
  );
}
