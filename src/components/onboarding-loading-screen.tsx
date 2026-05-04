"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_COPY } from "@/lib/copy";

const DURATION_MS = 2000;
const TICK_MS = 120;
const loadingMessages = SITE_COPY.onboarding.COPY_ONBOARDING_LOADING_MESSAGES;

export function OnboardingLoadingScreen() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepDuration = useMemo(
    () => Math.max(280, Math.floor(DURATION_MS / loadingMessages.length)),
    [],
  );

  useEffect(() => {
    const startedAt = Date.now();

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(nextProgress);
    }, TICK_MS);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => Math.min(loadingMessages.length - 1, current + 1));
    }, stepDuration);

    const finishTimer = window.setTimeout(() => {
      router.replace("/onboarding?complete=1");
    }, DURATION_MS);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
      window.clearTimeout(finishTimer);
    };
  }, [router, stepDuration]);

  return (
    <div className="mx-auto max-w-3xl rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-[0_30px_80px_-38px_rgba(15,23,42,0.42)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
        {SITE_COPY.onboarding.COPY_ONBOARDING_LOADING_EYEBROW_01}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-slate-900">
        {SITE_COPY.onboarding.COPY_ONBOARDING_LOADING_HEADLINE_01}
      </h2>

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="theme-progress-bar h-full rounded-full transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-6 text-slate-700">{loadingMessages[messageIndex]}</p>
      </div>
    </div>
  );
}
