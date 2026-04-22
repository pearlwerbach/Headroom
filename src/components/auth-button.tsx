"use client";

import { LogIn, LogOut } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  mode: "signin" | "signout";
  className?: string;
  provider?: "google" | "demo";
  label?: string;
  href?: string;
}

export function AuthButton({
  mode,
  className,
  provider = "google",
  label,
  href,
}: AuthButtonProps) {
  const isSignIn = mode === "signin";
  const sharedClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-white",
    className,
  );
  const callbackUrl = href ?? (provider === "demo" ? "/onboarding?edit=1" : "/dashboard");

  return (
    <button
      type="button"
      className={sharedClassName}
      onClick={() =>
        isSignIn
          ? signIn(provider, { callbackUrl })
          : signOut({ callbackUrl: "/" })
      }
    >
      {isSignIn ? <LogIn size={16} /> : <LogOut size={16} />}
      {label ?? (isSignIn ? (provider === "demo" ? "Start assessment" : "Continue with Google") : "Sign out")}
    </button>
  );
}
