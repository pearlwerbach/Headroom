"use client";

import { useMemo, useState, useTransition } from "react";
import { updateWeekHistoryFeedbackAction } from "@/app/actions/week-analysis";
import type {
  HistoryFeltLoad,
  HistoryRecoveryQuality,
} from "@/lib/week-analysis";

const FELT_LOAD_OPTIONS: Array<{ value: HistoryFeltLoad; label: string }> = [
  { value: "light", label: "Light" },
  { value: "manageable", label: "Manageable" },
  { value: "tight", label: "Tight" },
  { value: "overloaded", label: "Overloaded" },
];

const RECOVERY_OPTIONS: Array<{ value: HistoryRecoveryQuality; label: string }> = [
  { value: "poor", label: "Poor" },
  { value: "mixed", label: "Mixed" },
  { value: "good", label: "Good" },
  { value: "restorative", label: "Restorative" },
];

function SegmentedRow<T extends string>({
  label,
  options,
  value,
  pendingValue,
  onSelect,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value?: T;
  pendingValue?: T;
  onSelect: (next: T) => void;
}) {
  const resolvedValue = pendingValue ?? value;
  const placeholder = resolvedValue ? null : "Add rating";

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <div className="min-w-[88px]">
        <p className="text-[12px] font-medium text-[rgba(91,107,115,0.72)]">{label}</p>
        {placeholder ? (
          <p className="text-[11px] text-[rgba(91,107,115,0.56)]">{placeholder}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = resolvedValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={
                active
                  ? "rounded-full border border-[#CFC6BA] bg-[#E2DDD6] px-3 py-1.5 text-[13px] font-medium text-[#3A3A3A]"
                  : "rounded-full border border-[rgba(31,41,51,0.08)] bg-[#F1EEE9] px-3 py-1.5 text-[13px] font-medium text-[rgba(91,107,115,0.74)] transition hover:border-[rgba(31,41,51,0.14)] hover:text-[rgba(31,41,51,0.82)]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryFeedbackControls({
  weekStart,
  weekEnd,
  feltLoad,
  recoveryQuality,
}: {
  weekStart: string;
  weekEnd: string;
  feltLoad?: HistoryFeltLoad;
  recoveryQuality?: HistoryRecoveryQuality;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFeltLoad, setOptimisticFeltLoad] = useState<HistoryFeltLoad | undefined>(feltLoad);
  const [optimisticRecovery, setOptimisticRecovery] = useState<HistoryRecoveryQuality | undefined>(recoveryQuality);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const savedLabel = useMemo(() => {
    if (!savedAt) {
      return null;
    }

    return Date.now() - savedAt < 2500 ? "Saved" : null;
  }, [savedAt]);

  const savePartial = (
    update:
      | { feltLoad: HistoryFeltLoad; recoveryQuality?: undefined }
      | { feltLoad?: undefined; recoveryQuality: HistoryRecoveryQuality },
  ) => {
    startTransition(async () => {
      await updateWeekHistoryFeedbackAction({
        weekStart,
        weekEnd,
        ...update,
      });
      setSavedAt(Date.now());
    });
  };

  return (
    <div className="space-y-3 rounded-[18px] border border-[rgba(31,41,51,0.05)] bg-[#FAF8F5] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-[rgba(91,107,115,0.72)]">How it felt</p>
        <p className="text-[11px] text-[rgba(91,107,115,0.64)]">
          {isPending ? "Saving..." : savedLabel ?? ""}
        </p>
      </div>
      <div className="space-y-3">
        <SegmentedRow
          label="Felt load"
          options={FELT_LOAD_OPTIONS}
          value={feltLoad}
          pendingValue={optimisticFeltLoad}
          onSelect={(next) => {
            setOptimisticFeltLoad(next);
            savePartial({ feltLoad: next });
          }}
        />
        <SegmentedRow
          label="Recovery"
          options={RECOVERY_OPTIONS}
          value={recoveryQuality}
          pendingValue={optimisticRecovery}
          onSelect={(next) => {
            setOptimisticRecovery(next);
            savePartial({ recoveryQuality: next });
          }}
        />
      </div>
    </div>
  );
}
