"use client";

import { useFormStatus } from "react-dom";

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
      className="theme-button-primary inline-flex min-w-[11.5rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-wait disabled:hover:translate-y-0 disabled:opacity-95"
      aria-live="polite"
    >
      {pending ? (
        <>
          <span className="text-sm">Re-analyzing</span>
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-240ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
          </span>
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
