"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { submitOnboardingAction, type ActionState } from "@/app/actions/onboarding";
import { SITE_COPY } from "@/lib/copy";
import { quizQuestions } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const initialState: ActionState = { status: "idle" };

interface OnboardingQuizProps {
  returnTo?: "settings" | "onboarding";
}

export function OnboardingQuiz({ returnTo }: OnboardingQuizProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(submitOnboardingAction, initialState);
  const currentQuestion = quizQuestions[step];
  const isComplete = quizQuestions.every((question) => answers[question.id]);
  const serializedAnswers = useMemo(() => JSON.stringify(answers), [answers]);
  const isLastStep = step === quizQuestions.length - 1;

  function handleAnswerSelect(value: string) {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));

    if (!isLastStep) {
      setStep((current) => Math.min(quizQuestions.length - 1, current + 1));
      return;
    }

    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLButtonElement>("[data-submit-profile]")?.focus();
    });
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="answers" value={serializedAnswers} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="rounded-[32px] border border-[#E2D8D1] bg-white p-6 shadow-[0_18px_40px_rgba(31,41,51,0.07)] sm:p-8 lg:min-h-[540px] lg:px-10 lg:py-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            {SITE_COPY.onboarding.COPY_ONBOARDING_PROGRESS_LABEL_01(step + 1, quizQuestions.length)}
          </p>
          <div className="theme-button-soft shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold">
            {SITE_COPY.onboarding.COPY_ONBOARDING_PROGRESS_PILL_01(step + 1, quizQuestions.length)}
          </div>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#EEE9EC]">
          <div
            className="h-full rounded-full bg-[#8E7B91] transition-[width] duration-200 ease-out"
            style={{ width: `${((step + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        <div key={currentQuestion.id} className="assessment-enter space-y-6">
          <div className="space-y-3">
            <h2 className="font-serif text-[clamp(1.9rem,2vw,2.4rem)] leading-[1.04] tracking-tight text-slate-900">
              {currentQuestion.prompt}
            </h2>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const active = answers[currentQuestion.id] === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswerSelect(option.value)}
                  className={cn(
                    "rounded-[24px] border px-5 py-4 text-left transition duration-200 ease-out",
                    active
                      ? "border-[var(--color-primary)] bg-white text-slate-900 shadow-[0_22px_44px_-36px_var(--color-accent-shadow)]"
                      : "border-slate-200 bg-slate-50/90 text-slate-700 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)]",
                  )}
                >
                  <span className="flex items-start gap-3.5">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                          : "border-slate-300 bg-white text-slate-600",
                      )}
                    >
                      {option.value}
                    </span>
                    <span className="block text-base font-semibold leading-7">{option.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {SITE_COPY.onboarding.COPY_ONBOARDING_HELPER_01}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-40"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              <ArrowLeft size={16} />
              {SITE_COPY.onboarding.COPY_ONBOARDING_BACK_01}
            </button>
            {isLastStep ? (
              <button
                type="submit"
                data-submit-profile
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#4A3F48] px-5 py-2.5 text-sm font-semibold text-[rgba(255,255,255,0.95)] shadow-[0_2px_6px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:bg-[#3F353D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,63,72,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-[#362C33] disabled:opacity-40"
                disabled={!isComplete || pending}
              >
                {pending
                  ? SITE_COPY.onboarding.COPY_ONBOARDING_SAVE_PENDING_01
                  : SITE_COPY.onboarding.COPY_ONBOARDING_SAVE_IDLE_01}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {state.message ? (
        <p className={cn("text-sm", state.status === "error" ? "text-rose-600" : "text-emerald-600")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
