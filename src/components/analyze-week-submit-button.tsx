"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { SITE_COPY } from "@/lib/copy";

export function AnalyzeWeekSubmitButton({
  idleLabel,
}: {
  idleLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[56px] min-w-[13.5rem] items-center justify-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.16)] bg-[#2F2C3A] px-[22px] text-[16px] font-[650] tracking-[0.01em] text-[#F8F6F1] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition duration-150 ease-out hover:-translate-y-[1px] hover:bg-[#3A3646] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-0 active:bg-[#292633] active:shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:cursor-wait disabled:animate-[softPulse_900ms_ease-in-out_infinite] disabled:hover:translate-y-0 disabled:bg-[rgba(47,44,58,0.72)] disabled:text-[rgba(248,246,241,0.88)] disabled:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      aria-live="polite"
    >
      {pending ? (
        <>
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-[rgba(248,246,241,0.28)] border-t-[rgba(248,246,241,0.88)]"
            aria-hidden="true"
          />
          <span className="text-[16px]">{SITE_COPY.dashboard.COPY_DASHBOARD_ANALYZE_PENDING_01}</span>
        </>
      ) : (
        <>
          <RefreshCw size={14} strokeWidth={2} className="text-[#F8F6F1] opacity-90" aria-hidden="true" />
          <span>{idleLabel}</span>
        </>
      )}
    </button>
  );
}
