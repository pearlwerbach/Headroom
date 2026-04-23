import {
  Activity,
  BookOpen,
  Clock3,
  Coffee,
  Users,
} from "lucide-react";
import { DEFAULT_SLEEP_HOUR, DEFAULT_WAKE_HOUR } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface RecoveryIslandSegment {
  startMinute: number;
  endMinute: number;
  tone: "exercise" | "social" | "care" | "rest" | "open";
  emphasis?: "steady" | "tentative";
  displayLabel?: string;
  timeLabel?: string;
}

export interface RecoveryIslandDay {
  label: string;
  date: Date;
  totalRecoveryMinutes: number;
  segments: RecoveryIslandSegment[];
}

const SEGMENT_TONES: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "bg-[#7BAA8D]/75",
  social: "bg-[#D8A7A7]/72",
  care: "bg-[#E2B46A]/72",
  rest: "bg-[#B7A9D6]/72",
  open: "bg-[#E7E1D8]",
};

const LEGEND_ITEMS: Array<{ tone: RecoveryIslandSegment["tone"]; label: string }> = [
  { tone: "exercise", label: "Exercise" },
  { tone: "social", label: "Social support" },
  { tone: "care", label: "Meals / care" },
  { tone: "rest", label: "Explicit rest" },
  { tone: "open", label: "Unplanned time" },
];

const LEGEND_DESCRIPTIONS: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "Movement that helps your system reset.",
  social: "Connection that restores balance and perspective.",
  care: "Meals and care routines that support recovery.",
  rest: "Planned rest that protects your capacity.",
  open: "Breathing room that creates space to reset.",
};

const SEGMENT_ICON_CHIP: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "bg-[#E5F0E8] text-[#5A836A]",
  social: "bg-[#EFECF8] text-[#6D63A1]",
  care: "bg-[#F8EFD9] text-[#A77525]",
  rest: "bg-[#E9F0FB] text-[#597FBC]",
  open: "bg-[#F0EDE8] text-[#7B7368]",
};

function formatMinutesAsHours(minutes: number) {
  if (minutes <= 0) {
    return "0h";
  }

  const hours = minutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function segmentStyle(segment: RecoveryIslandSegment) {
  const totalBandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;
  const leftPercent = (segment.startMinute / totalBandMinutes) * 100;
  const widthPercent = Math.max(
    4.5,
    ((segment.endMinute - segment.startMinute) / totalBandMinutes) * 100,
  );

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}

function getSegmentIcon(tone: RecoveryIslandSegment["tone"]) {
  switch (tone) {
    case "exercise":
      return Activity;
    case "social":
      return Users;
    case "care":
      return Coffee;
    case "rest":
      return BookOpen;
    case "open":
    default:
      return Clock3;
  }
}

export function RecoveryIslandsVisual({
  days,
}: {
  days: RecoveryIslandDay[];
}) {
  const sortedDays = [...days].sort((left, right) => left.date.getDay() - right.date.getDay());

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[820px] space-y-4">
          <div className="grid grid-cols-[72px_1fr] items-center gap-5">
            <div />
            <div className="grid grid-cols-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span>7 AM</span>
              <span className="text-center">12 PM</span>
              <span className="text-center">6 PM</span>
              <span className="text-right">11 PM</span>
            </div>
          </div>

          <div className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day.date.toISOString()} className="grid grid-cols-[72px_1fr] items-center gap-5">
                <div className="space-y-1.5">
                  <p className="text-[14px] font-semibold text-slate-900">{day.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {formatMinutesAsHours(day.totalRecoveryMinutes)}
                  </p>
                </div>
                <div className="relative h-[74px] overflow-hidden rounded-full border border-[#E8E2DB] bg-[rgba(255,255,255,0.86)]">
                  <div className="pointer-events-none absolute inset-y-0 left-[31.25%] border-l border-dashed border-[#ECE4DA]" />
                  <div className="pointer-events-none absolute inset-y-0 left-[68.75%] border-l border-dashed border-[#ECE4DA]" />

                  {day.segments.map((segment, index) => {
                    const Icon = getSegmentIcon(segment.tone);
                    const hasDetail = Boolean(segment.displayLabel && segment.timeLabel);

                    return (
                      <div
                        key={`${index}-${segment.tone}-${segment.startMinute}`}
                        className={cn(
                          "absolute top-1/2 flex h-[50px] -translate-y-1/2 items-center gap-2 overflow-hidden rounded-[20px] px-3",
                          SEGMENT_TONES[segment.tone],
                          segment.emphasis === "steady" &&
                            "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
                          segment.emphasis === "tentative" &&
                            "border border-dashed border-[#E3E6EA] bg-[#F7F8F9]",
                        )}
                        style={segmentStyle(segment)}
                      >
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            SEGMENT_ICON_CHIP[segment.tone],
                          )}
                        >
                          <Icon size={14} strokeWidth={2} />
                        </span>
                        {hasDetail ? (
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-medium leading-4 text-slate-800">
                              {segment.displayLabel}
                            </span>
                            <span className="block truncate text-[11px] leading-4 text-slate-600">
                              {segment.timeLabel}
                            </span>
                          </span>
                        ) : segment.displayLabel ? (
                          <span className="truncate text-[12px] font-medium leading-4 text-slate-800">
                            {segment.displayLabel}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecoveryLegendCard() {
  return (
    <div className="rounded-[22px] border border-[#E8E2DB] bg-[rgba(255,255,255,0.82)] px-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {LEGEND_ITEMS.map((item) => {
          const Icon = getSegmentIcon(item.tone);

          return (
            <div key={item.tone} className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  SEGMENT_ICON_CHIP[item.tone],
                )}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                <span className="block text-[13px] leading-6 text-slate-500">
                  {LEGEND_DESCRIPTIONS[item.tone]}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
