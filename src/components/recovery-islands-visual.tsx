import type { CSSProperties } from "react";
import {
  Activity,
  BookOpen,
  Clock3,
  Coffee,
  Users,
} from "lucide-react";
import { DEFAULT_SLEEP_HOUR, DEFAULT_WAKE_HOUR } from "@/lib/constants";
import { SITE_COPY } from "@/lib/copy";
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
  { tone: "exercise", label: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_01 },
  { tone: "social", label: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_02 },
  { tone: "care", label: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_03 },
  { tone: "rest", label: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_04 },
];

const LEGEND_DESCRIPTIONS: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_BODY_01,
  social: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_BODY_02,
  care: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_BODY_03,
  rest: SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_LEGEND_BODY_04,
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

  if (midpoint < 660) {
    return "afternoon";
  }

  return "evening";
}

type RecoveryZone = "morning" | "afternoon" | "evening";
type PositionedSegment = {
  segment: RecoveryIslandSegment;
  style: {
    left: string;
    width: string;
  };
};

function buildSegmentLayouts(segments: RecoveryIslandSegment[]) {
  const totalBandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;
  const zoneFrames: Record<RecoveryZone, { left: number; width: number }> = {
    morning: { left: 2, width: 30 },
    afternoon: { left: 35, width: 30 },
    evening: { left: 68, width: 30 },
  };
  const minWidthPercent = 15.5;
  const maxWidthPercent = 21;
  const pillGapPercent = 1.35;
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
  const byZone = sorted.reduce<Record<RecoveryZone, RecoveryIslandSegment[]>>(
    (groups, segment) => {
      groups[getSegmentZone(segment)].push(segment);
      return groups;
    },
    { morning: [], afternoon: [], evening: [] },
  );

  const positioned: PositionedSegment[] = [];

  (Object.keys(zoneFrames) as RecoveryZone[]).forEach((zone) => {
    const zoneSegments = byZone[zone];

    if (zoneSegments.length === 0) {
      return;
    }

    const zoneFrame = zoneFrames[zone];
    const availableWidth = zoneFrame.width;

    const preferredWidths = zoneSegments.map((segment) => {
      const durationMinutes = Math.max(0, segment.endMinute - segment.startMinute);
      return Math.max(
        minWidthPercent,
        Math.min(maxWidthPercent, 15.5 + ((durationMinutes / totalBandMinutes) * 100) * 0.38),
      );
    });

    const gapTotal = Math.max(0, zoneSegments.length - 1) * pillGapPercent;
    const totalPreferredWidth =
      preferredWidths.reduce((sum, width) => sum + width, 0) + gapTotal;
    const scale =
      totalPreferredWidth > availableWidth
        ? Math.max(0.78, (availableWidth - gapTotal) / Math.max(1, preferredWidths.reduce((sum, width) => sum + width, 0)))
        : 1;

    let cursor = zoneFrame.left;

    zoneSegments.forEach((segment, index) => {
      const widthPercent = Math.min(
        maxWidthPercent,
        Math.max(availableWidth / Math.max(zoneSegments.length, 1) - pillGapPercent, preferredWidths[index]! * scale),
      );

      if (cursor + widthPercent > zoneFrame.left + zoneFrame.width) {
        cursor = Math.max(zoneFrame.left, zoneFrame.left + zoneFrame.width - widthPercent);
      }

      positioned.push({
        segment,
        style: {
          left: `${cursor}%`,
          width: `${Math.min(widthPercent, zoneFrame.left + zoneFrame.width - cursor)}%`,
        },
      });

      cursor += widthPercent + pillGapPercent;
    });
  });

  return positioned;
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
  const rowHeight = 76;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[920px] space-y-3.5">
          <div className="grid grid-cols-[110px_1fr] items-center gap-4">
            <div />
            <div className="grid grid-cols-4 text-[10px] tracking-[0.04em] text-slate-500/55">
              <span>{SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_01}</span>
              <span className="text-center">{SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_02}</span>
              <span className="text-center">{SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_03}</span>
              <span className="text-right">{SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_04}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedDays.map((day) => {
              const visibleSegments = day.segments.filter((segment) => segment.tone !== "open");
              const layout = buildSegmentLayouts(visibleSegments);

              return (
                <div key={day.date.toISOString()} className="grid grid-cols-[110px_1fr] items-center gap-4">
                  <div className="space-y-0.5 self-center">
                    <p className="text-[14px] font-semibold leading-[1.15] text-slate-900">
                      {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                    <p className="text-[10px] leading-[1.15] tracking-[0.02em] text-slate-500">
                      {formatMinutesAsHours(day.totalRecoveryMinutes)}
                    </p>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-[24px] border border-[#C8D7CC] bg-[rgba(249,252,248,0.72)]"
                    style={{ height: `${rowHeight}px` }}
                  >
                    <div className="pointer-events-none absolute inset-x-3 top-1/2 h-[42px] -translate-y-1/2 rounded-[18px] bg-[rgba(255,255,255,0.14)]" />
                    <div className="pointer-events-none absolute inset-y-0 left-[31.25%] border-l border-dashed border-[#E2EBE1]/55" />
                    <div className="pointer-events-none absolute inset-y-0 left-[68.75%] border-l border-dashed border-[#E2EBE1]/55" />

                    {layout.map(({ segment, style }, index) => {
                      const Icon = getSegmentIcon(segment.tone);
                      const hasDetail = Boolean(segment.displayLabel && segment.timeLabel);

                      return (
                        <div
                          key={`${index}-${segment.tone}-${segment.startMinute}`}
                          className={cn(
                            "absolute left-0 top-1/2 z-10 flex h-[30px] min-w-[145px] max-w-[186px] -translate-y-1/2 items-center gap-2 overflow-hidden rounded-[15px] px-3.5 shadow-[0_5px_12px_rgba(76,94,84,0.09)]",
                            SEGMENT_TONES[segment.tone],
                            segment.emphasis === "steady" && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
                            segment.emphasis === "tentative" && "z-0 opacity-82 shadow-[0_3px_8px_rgba(76,94,84,0.04)]",
                          )}
                          style={style as CSSProperties}
                        >
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              SEGMENT_ICON_CHIP[segment.tone],
                            )}
                          >
                            <Icon size={10} strokeWidth={2} />
                          </span>
                          {hasDetail ? (
                            <span className="min-w-0">
                              <span className="block truncate whitespace-nowrap text-[13px] font-medium leading-[1.08] text-slate-800">
                                {segment.displayLabel}
                              </span>
                              <span className="block truncate whitespace-nowrap text-[11px] tracking-[0.01em] leading-[1.08] text-slate-600">
                                {segment.timeLabel}
                              </span>
                            </span>
                          ) : segment.displayLabel ? (
                            <span className="truncate whitespace-nowrap text-[13px] font-medium leading-[1.1] text-slate-800">
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
    <div className="rounded-[22px] border border-[#D1DDD2] bg-[rgba(255,255,255,0.78)] px-5 py-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {LEGEND_ITEMS.map((item) => {
          const Icon = getSegmentIcon(item.tone);

          return (
            <div key={item.tone} className="space-y-2.5 text-center">
              <div className="flex items-center justify-center gap-2.5">
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
              <p className="px-1 text-[13px] leading-6 text-slate-500">
                {LEGEND_DESCRIPTIONS[item.tone]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
