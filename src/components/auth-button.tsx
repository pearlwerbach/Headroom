"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { SITE_COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  mode: "signin" | "signout";
  className?: string;
  provider?: "google" | "demo" | "assessment";
  label?: string;
  href?: string;
  variant?: "primary" | "secondary";
}

export function AuthButton({
  mode,
  className,
  provider = "google",
  label,
  href,
  variant = "primary",
}: AuthButtonProps) {
  const isSignIn = mode === "signin";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isGoogleLandingAction = isSignIn && provider === "google";
  const isAssessmentLandingAction = isSignIn && provider === "assessment";
  const sharedClassName = cn(
    isGoogleLandingAction && variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(255,255,255,0.16)] bg-[#2F2C3A] px-5 py-3 text-[16px] font-[650] text-[#F8F6F1] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#3A3646] disabled:cursor-wait disabled:bg-[rgba(47,44,58,0.72)] disabled:text-[rgba(248,246,241,0.88)]"
      : isGoogleLandingAction && variant === "secondary"
        ? "inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(47,44,58,0.16)] bg-[rgba(255,255,255,0.82)] px-4 py-2.5 text-[15px] font-semibold text-[#2F2C3A] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:bg-[rgba(255,255,255,0.62)] disabled:text-[rgba(47,44,58,0.56)]"
        : isAssessmentLandingAction && variant === "primary"
          ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#4F4654] px-5 py-3 text-[16px] font-medium text-[#F8F7F5] shadow-[0_10px_22px_rgba(45,38,50,0.16)] transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#5B5261] disabled:cursor-wait disabled:bg-[rgba(79,70,84,0.72)] disabled:text-[rgba(248,247,245,0.88)]"
      : "inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-80",
    className,
  );
  const callbackUrl =
    href ?? (provider === "demo" || provider === "assessment" ? "/onboarding?edit=1" : "/dashboard");

  return (
    <button
      type="button"
      className={sharedClassName}
      disabled={pending}
      onClick={() => {
        setPending(true);

        if (isSignIn) {
          if (isAssessmentLandingAction) {
            router.push(href ?? "/onboarding?edit=1");
            setPending(false);
            return;
          }

          if (isGoogleLandingAction && href) {
            window.location.assign(href);
            return;
          }

          void signIn(provider, { callbackUrl }).finally(() => {
            setPending(false);
          });
          return;
        }

        void signOut({ callbackUrl: "/" }).finally(() => {
          setPending(false);
        });
      }}
    >
      {isSignIn ? (
        <LogIn
          size={16}
          className={
            isGoogleLandingAction || isAssessmentLandingAction
              ? variant === "primary"
                ? isAssessmentLandingAction
                  ? "text-[#F8F7F5]"
                  : "text-[#F8F6F1]"
                : "text-[#2F2C3A]"
              : undefined
          }
          aria-hidden="true"
        />
      ) : (
        <LogOut size={16} />
      )}
      {label ??
        (isSignIn
          ? provider === "demo" || provider === "assessment"
            ? SITE_COPY.shared.COPY_SHARED_AUTH_SIGNIN_DEMO_01
            : SITE_COPY.shared.COPY_SHARED_AUTH_SIGNIN_GOOGLE_01
          : SITE_COPY.shared.COPY_SHARED_AUTH_SIGNOUT_01)}
    </button>
  );
}
