"use client";

import { useFormStatus } from "react-dom";
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
      className="inline-flex min-w-[13.75rem] items-center justify-center gap-2.5 rounded-full border border-[#567364] bg-[#617D70] px-7 py-3.5 text-[14px] font-medium tracking-[0.02em] text-[#F8F7F4] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_22px_-14px_rgba(43,59,51,0.42)] transition duration-150 hover:-translate-y-[1px] hover:bg-[#587366] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_28px_-14px_rgba(43,59,51,0.46)] active:translate-y-0 active:bg-[#526c60] active:shadow-[inset_0_2px_4px_rgba(32,45,38,0.18),0_6px_14px_-12px_rgba(43,59,51,0.35)] disabled:cursor-wait disabled:animate-[softPulse_900ms_ease-in-out_infinite] disabled:hover:translate-y-0 disabled:bg-[#617D70] disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(134,164,148,0.1),0_12px_24px_-18px_rgba(61,85,72,0.44)]"
      aria-live="polite"
    >
      {pending ? (
        <>
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-[#F8F7F4]/35 border-t-[#F8F7F4]"
            aria-hidden="true"
          />
          <span className="text-[14px]">{SITE_COPY.dashboard.COPY_DASHBOARD_ANALYZE_PENDING_01}</span>
          <span className="inline-flex items-center gap-1 opacity-90" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F8F7F4] [animation-delay:-240ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F8F7F4] [animation-delay:-120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F8F7F4]" />
          </span>
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
