import {
  Activity,
  BookOpen,
  Clock3,
  Coffee,
  Users,
} from "lucide-react";
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
  exercise: "border border-[#AFC3CC] bg-[#DDE8EF]",
  social: "border border-[#CDBFE3] bg-[#EEE8F7]",
  care: "border border-[#DEC28A] bg-[#F7EBCF]",
  rest: "border border-[#B8CAE5] bg-[#E6EEF9]",
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
  exercise: "bg-[#C9D9E2] text-[#526F7A]",
  social: "bg-[#D9CDEE] text-[#77659A]",
  care: "bg-[#E9D6A6] text-[#9A7332]",
  rest: "bg-[#CFDDF0] text-[#5B78A6]",
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
type ZoneGroups = Record<RecoveryZone, RecoveryIslandSegment[]>;

function formatRecoveryZone(zone: RecoveryZone) {
  switch (zone) {
    case "morning":
      return "Morning";
    case "afternoon":
      return "Afternoon";
    case "evening":
    default:
      return "Evening";
  }
}

function buildZoneGroups(segments: RecoveryIslandSegment[]) {
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

  return sorted.reduce<ZoneGroups>(
    (groups, segment) => {
      groups[getSegmentZone(segment)].push(segment);
      return groups;
    },
    { morning: [], afternoon: [], evening: [] },
  );
}

function getZoneLayout(groups: ZoneGroups) {
  return {
    morning:
      groups.morning.length > 1
        ? "flex min-w-0 items-center justify-start gap-2 overflow-hidden"
        : "flex min-w-0 items-center justify-start gap-2.5 overflow-hidden",
    afternoon:
      groups.afternoon.length > 1
        ? "flex min-w-0 items-center justify-center gap-2 overflow-hidden"
        : "flex min-w-0 items-center justify-center gap-2.5 overflow-hidden",
    evening:
      groups.evening.length > 1
        ? "flex min-w-0 items-center justify-end gap-2 overflow-hidden"
        : "flex min-w-0 items-center justify-end gap-2.5 overflow-hidden",
  };
}

function getSegmentSizeClasses(segmentCount: number) {
  if (segmentCount <= 1) {
    return "w-full min-w-0 max-w-[230px] flex-none";
  }

  return "min-w-0 max-w-[210px] flex-1 basis-0";
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
  const rowHeight = 68;

  return (
    <div className="w-full space-y-3 overflow-hidden">
      <div className="space-y-2.5">
        <div className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4">
          <div />
          <div className="grid grid-cols-3 items-center gap-3 px-5 text-[12px] font-medium tracking-[0.03em] text-slate-600/80">
            <span className="justify-self-start">Morning</span>
            <span className="justify-self-center">Afternoon</span>
            <span className="justify-self-end">Evening</span>
          </div>
        </div>

        <div className="space-y-2">
          {sortedDays.map((day) => {
            const visibleSegments = day.segments.filter((segment) => segment.tone !== "open");
            const groups = buildZoneGroups(visibleSegments);
            const zoneLayout = getZoneLayout(groups);

            return (
              <div key={day.date.toISOString()} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4">
                <div className="space-y-0.5 self-center">
                  <p className="text-[16px] font-semibold leading-[1.12] text-slate-900">
                    {day.date.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <p className="text-[11px] leading-[1.15] tracking-[0.02em] text-slate-500">
                    {formatMinutesAsHours(day.totalRecoveryMinutes)}
                  </p>
                </div>
                <div
                  className="relative overflow-hidden grid grid-cols-3 items-center gap-3 rounded-[20px] border border-[rgba(91,120,103,0.14)] bg-[rgba(255,255,255,0.62)] px-5"
                  style={{ height: `${rowHeight}px` }}
                >
                  {(["morning", "afternoon", "evening"] as RecoveryZone[]).map((zone) => (
                    <div
                      key={zone}
                      className={cn(
                        "flex min-w-0 items-center justify-center",
                        zoneLayout[zone],
                      )}
                    >
                      {groups[zone].map((segment, index) => {
                        const Icon = getSegmentIcon(segment.tone);
                        const periodLabel = formatRecoveryZone(zone);
                        const hasDetail = Boolean(segment.displayLabel);
                        const compact = groups[zone].length > 1;

                        return (
                          <div
                            key={`${zone}-${index}-${segment.tone}-${segment.startMinute}`}
                            className={cn(
                              "flex h-[38px] items-center gap-2 rounded-full px-3 py-0.5 shadow-[0_4px_10px_rgba(76,94,84,0.08)]",
                              getSegmentSizeClasses(groups[zone].length),
                              SEGMENT_TONES[segment.tone],
                              segment.emphasis === "steady" && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
                              segment.emphasis === "tentative" && "opacity-82 shadow-[0_3px_8px_rgba(76,94,84,0.04)]",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                SEGMENT_ICON_CHIP[segment.tone],
                              )}
                            >
                              <Icon size={16} strokeWidth={1.9} />
                            </span>
                            {hasDetail ? (
                              <span className="flex min-w-0 flex-col justify-center gap-0">
                                <span
                                  className={cn(
                                    "m-0 block whitespace-nowrap font-semibold leading-tight text-[rgba(31,41,51,0.82)]",
                                    compact ? "text-[13px]" : "text-[13.5px]",
                                  )}
                                >
                                  {segment.displayLabel}
                                </span>
                                <span
                                  className={cn(
                                    "m-0 mt-0 block whitespace-nowrap font-medium tracking-[0.01em] leading-tight text-[rgba(91,107,115,0.68)]",
                                    compact ? "text-[10.5px]" : "text-[11px]",
                                  )}
                                >
                                  {periodLabel}
                                </span>
                              </span>
                            ) : segment.displayLabel ? (
                              <span
                                className={cn(
                                  "whitespace-nowrap font-semibold leading-[1.2] text-[rgba(31,41,51,0.82)]",
                                  compact ? "text-[13px]" : "text-[13.5px]",
                                )}
                              >
                                {segment.displayLabel}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RecoveryLegendCard() {
  return (
    <div className="h-full rounded-[22px] border border-[rgba(31,41,51,0.08)] bg-[rgba(255,255,255,0.86)] px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="grid h-full gap-x-5 gap-y-3 md:grid-cols-2 xl:grid-cols-4 xl:items-center">
        {LEGEND_ITEMS.map((item) => {
          const Icon = getSegmentIcon(item.tone);

          return (
            <div key={item.tone} className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    SEGMENT_ICON_CHIP[item.tone],
                  )}
                >
                  <Icon size={15} strokeWidth={2} />
                </span>
                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              </div>
              <p className="px-1 text-[12px] leading-[1.45] text-slate-500">
                {LEGEND_DESCRIPTIONS[item.tone]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
