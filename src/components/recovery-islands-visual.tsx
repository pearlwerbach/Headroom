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
  exercise: "border border-[#AFC9C5] bg-[#D3E6E3]",
  social: "border border-[#D8CCE8] bg-[#EEEAF8]",
  care: "border border-[#E6D1A4] bg-[#F6ECD3]",
  rest: "border border-[#C9D7ED] bg-[#EAF1FB]",
  open: "border border-[#DDD6CB] bg-[#F5F1EB]",
};

const LEGEND_ITEMS: Array<{ tone: RecoveryIslandSegment["tone"]; label: string }> = [
  { tone: "exercise", label: "Exercise" },
  { tone: "social", label: "Social support" },
  { tone: "care", label: "Meals / care" },
  { tone: "rest", label: "Explicit rest" },
];

const LEGEND_DESCRIPTIONS: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "Movement that helps your system reset.",
  social: "Connection that restores balance and perspective.",
  care: "Meals and care routines that support recovery.",
  rest: "Planned rest that protects your capacity.",
  open: "Breathing room that creates space to reset.",
};

const SEGMENT_ICON_CHIP: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "bg-[#E1EEEC] text-[#4F7772]",
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

function getSegmentZone(segment: RecoveryIslandSegment) {
  const midpoint = (segment.startMinute + segment.endMinute) / 2;

  if (midpoint < 240) {
    return "morning";
  }

  if (midpoint < 480) {
    return "midday";
  }

  if (midpoint < 660) {
    return "afternoon";
  }

  return "evening";
}

function buildSegmentLayouts(segments: RecoveryIslandSegment[]) {
  const totalBandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;
  const zoneBase: Record<string, number> = {
    morning: 0,
    midday: 25,
    afternoon: 50,
    evening: 75,
  };
  const zoneStartMinute: Record<string, number> = {
    morning: 0,
    midday: 240,
    afternoon: 480,
    evening: 660,
  };
  const zoneSpan: Record<string, number> = {
    morning: 240,
    midday: 240,
    afternoon: 180,
    evening: 300,
  };

  const priority = (segment: RecoveryIslandSegment) => {
    if (segment.tone === "open") return 0;
    if (segment.emphasis === "tentative") return 1;
    return 2;
  };

  const sorted = [...segments].sort((left, right) => {
    const leftPriority = priority(left);
    const rightPriority = priority(right);

    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    if (left.startMinute !== right.startMinute) {
      return left.startMinute - right.startMinute;
    }

    return (right.endMinute - right.startMinute) - (left.endMinute - left.startMinute);
  });
  const rowRightEdges = [-2, -2];

  return sorted.map((segment) => {
    const durationMinutes = Math.max(0, segment.endMinute - segment.startMinute);
    const zone = getSegmentZone(segment);
    const baseLeft = zoneBase[zone];
    const offsetWithinZone = Math.max(
      0,
      Math.min(
        7,
        ((segment.startMinute - zoneStartMinute[zone]) / zoneSpan[zone]) * 7,
      ),
    );
    let widthPercent = Math.max(
      14,
      Math.min(
        22,
        14 + ((durationMinutes / totalBandMinutes) * 100) * 0.42,
      ),
    );

    let leftPercent = baseLeft + offsetWithinZone;
    let rowIndex = 0;
    const gap = 1.2;

    if (leftPercent < rowRightEdges[0] + gap) {
      rowIndex = leftPercent >= rowRightEdges[1] + gap ? 1 : 0;
    }

    if (leftPercent < rowRightEdges[rowIndex] + gap) {
      leftPercent = rowRightEdges[rowIndex] + gap;
    }

    if (leftPercent > 100 - widthPercent - 1) {
      widthPercent = Math.max(12, 100 - leftPercent - 1);
    }

    if (leftPercent > 87) {
      leftPercent = 87;
      widthPercent = Math.min(widthPercent, 12);
    }

    rowRightEdges[rowIndex] = leftPercent + widthPercent;

    return {
      segment,
      style: {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: rowIndex === 0 ? "5px" : "25px",
      },
    };
  });
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
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[860px] space-y-3">
          <div className="grid grid-cols-[110px_1fr] items-center gap-4">
            <div />
            <div className="grid grid-cols-4 text-[10px] tracking-[0.04em] text-slate-500/65">
              <span>7 AM</span>
              <span className="text-center">12 PM</span>
              <span className="text-center">6 PM</span>
              <span className="text-right">11 PM</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedDays.map((day) => {
              const visibleSegments = day.segments.filter((segment) => segment.tone !== "open");

              return (
                <div key={day.date.toISOString()} className="grid grid-cols-[110px_1fr] items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[14px] font-semibold text-slate-900">
                      {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                    <p className="text-[11px] tracking-[0.02em] text-slate-500">
                      {formatMinutesAsHours(day.totalRecoveryMinutes)}
                    </p>
                  </div>
                  <div className="relative h-[46px] overflow-hidden rounded-full border border-[#C8D7CC] bg-[rgba(249,252,248,0.76)]">
                    <div className="pointer-events-none absolute inset-y-0 left-[31.25%] border-l border-dashed border-[#E2EBE1]" />
                    <div className="pointer-events-none absolute inset-y-0 left-[68.75%] border-l border-dashed border-[#E2EBE1]" />

                    {buildSegmentLayouts(visibleSegments).map(({ segment, style }, index) => {
                      const Icon = getSegmentIcon(segment.tone);
                      const hasDetail = Boolean(segment.displayLabel && segment.timeLabel);

                      return (
                        <div
                          key={`${index}-${segment.tone}-${segment.startMinute}`}
                          className={cn(
                            "absolute z-10 flex h-[18px] items-center gap-2 overflow-hidden rounded-[14px] px-3 shadow-[0_4px_10px_rgba(76,94,84,0.08)]",
                            SEGMENT_TONES[segment.tone],
                            segment.emphasis === "steady" && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
                            segment.emphasis === "tentative" && "z-0 opacity-82 shadow-[0_3px_8px_rgba(76,94,84,0.04)]",
                          )}
                          style={style}
                        >
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                              "h-5 w-5",
                              SEGMENT_ICON_CHIP[segment.tone],
                            )}
                          >
                            <Icon size={10} strokeWidth={2} />
                          </span>
                          {hasDetail ? (
                            <span className="min-w-0">
                              <span className="block truncate whitespace-nowrap text-[11px] font-medium leading-3 text-slate-800">
                                {segment.displayLabel}
                              </span>
                              <span className="block truncate whitespace-nowrap text-[9px] tracking-[0.01em] leading-3 text-slate-600">
                                {segment.timeLabel}
                              </span>
                            </span>
                          ) : segment.displayLabel ? (
                            <span className="truncate whitespace-nowrap text-[11px] font-medium leading-3 text-slate-800">
                              {segment.displayLabel}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecoveryLegendCard() {
  return (
    <div className="rounded-[22px] border border-[#D1DDD2] bg-[rgba(255,255,255,0.78)] px-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {LEGEND_ITEMS.map((item) => {
          const Icon = getSegmentIcon(item.tone);

          return (
            <div key={item.tone} className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    SEGMENT_ICON_CHIP[item.tone],
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              </div>
              <p className="text-[13px] leading-6 text-slate-500">
                {LEGEND_DESCRIPTIONS[item.tone]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
