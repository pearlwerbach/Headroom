import { DEFAULT_SLEEP_HOUR, DEFAULT_WAKE_HOUR } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface RecoveryIslandSegment {
  startMinute: number;
  endMinute: number;
  tone: "exercise" | "social" | "care" | "rest" | "open";
  emphasis?: "steady" | "tentative";
}

export interface RecoveryIslandDay {
  label: string;
  date: Date;
  totalRecoveryMinutes: number;
  segments: RecoveryIslandSegment[];
}

const SEGMENT_TONES: Record<RecoveryIslandSegment["tone"], string> = {
  exercise: "bg-emerald-300/85",
  social: "bg-rose-200/90",
  care: "bg-violet-200/85",
  rest: "bg-sky-200/90",
  open: "bg-slate-200/95",
};

const LEGEND_ITEMS: Array<{ tone: RecoveryIslandSegment["tone"]; label: string }> = [
  { tone: "exercise", label: "Exercise" },
  { tone: "social", label: "Social support" },
  { tone: "care", label: "Meals / care" },
  { tone: "rest", label: "Explicit rest" },
  { tone: "open", label: "Unplanned time" },
];

function formatRangeLabel() {
  return `${DEFAULT_WAKE_HOUR}:00-${DEFAULT_SLEEP_HOUR}:00`;
}

function formatMinutesAsHours(minutes: number) {
  if (minutes <= 0) {
    return "0h";
  }

  const hours = minutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function segmentStyle(segment: RecoveryIslandSegment) {
  const totalBandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;
  const left = `${(segment.startMinute / totalBandMinutes) * 100}%`;
  const width = `${Math.max(1, ((segment.endMinute - segment.startMinute) / totalBandMinutes) * 100)}%`;

  return {
    left,
    width,
  };
}

export function RecoveryIslandsVisual({
  days,
}: {
  days: RecoveryIslandDay[];
}) {
  const sortedDays = [...days].sort((left, right) => left.date.getDay() - right.date.getDay());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <span>Recovery across the week</span>
        <span>{formatRangeLabel()}</span>
      </div>

      <div className="space-y-3.5">
        {sortedDays.map((day) => (
          <div key={day.date.toISOString()} className="grid grid-cols-[52px_1fr] items-center gap-3">
            <div className="space-y-1">
              <p className="text-[13px] font-semibold text-slate-900">{day.label}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {formatMinutesAsHours(day.totalRecoveryMinutes)}
              </p>
            </div>
            <div className="relative h-10 overflow-hidden rounded-full border border-slate-200/80 bg-white/80">
              {day.segments.map((segment, index) => (
                <div
                  key={`${index}-${segment.tone}-${segment.startMinute}`}
                  className={cn(
                    "absolute top-1/2 h-5 -translate-y-1/2 rounded-full",
                    SEGMENT_TONES[segment.tone],
                    segment.emphasis === "steady" && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
                    segment.emphasis === "tentative" &&
                      "border border-dashed border-slate-300 bg-slate-100/85",
                  )}
                  style={segmentStyle(segment)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 rounded-[20px] border border-slate-200/60 bg-white/68 px-3.5 py-3.5">
        <div className="flex flex-wrap gap-2.5">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.tone} className="inline-flex items-center gap-2 text-xs text-slate-600">
              <span className={cn("h-2 w-2 rounded-full", SEGMENT_TONES[item.tone])} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-left text-xs leading-5 text-slate-500">
          Visible reset, support, and breathable unplanned time across the week.
        </p>
      </div>
    </div>
  );
}
