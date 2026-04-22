import type { WeekShapeDay, WeekShapeSegment, WeekEventType } from "@/lib/domain";
import { DEFAULT_SLEEP_HOUR, DEFAULT_WAKE_HOUR } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EVENT_TYPE_TINTS: Record<WeekEventType, string> = {
  class: "bg-sky-200/75",
  evaluative: "bg-red-200/85",
  study_work: "bg-slate-200/85",
  work_meeting: "bg-indigo-200/80",
  deep_work: "bg-slate-300/80",
  admin: "bg-amber-200/80",
  social: "bg-rose-200/80",
  exercise: "bg-emerald-200/85",
  meal: "bg-orange-200/85",
  appointment: "bg-violet-200/80",
  commute: "bg-stone-300/80",
  travel: "bg-cyan-200/80",
  errand: "bg-yellow-200/80",
  personal_care: "bg-fuchsia-200/70",
  unknown: "bg-slate-200/90",
};

const LEGEND_ITEMS: Array<{ eventType: WeekEventType; label: string }> = [
  { eventType: "class", label: "Class" },
  { eventType: "work_meeting", label: "Meeting" },
  { eventType: "exercise", label: "Exercise" },
  { eventType: "social", label: "Social" },
  { eventType: "unknown", label: "Other" },
];

function formatRangeLabel() {
  return `${DEFAULT_WAKE_HOUR}:00-${DEFAULT_SLEEP_HOUR}:00`;
}

function segmentStyle(segment: WeekShapeSegment) {
  const totalBandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;
  const left = `${(segment.startMinute / totalBandMinutes) * 100}%`;
  const width = `${Math.max(1, ((segment.endMinute - segment.startMinute) / totalBandMinutes) * 100)}%`;

  return {
    left,
    width,
  };
}

export function WeekShapeVisual({
  days,
}: {
  days: WeekShapeDay[];
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <span>Usable time map</span>
        <span>{formatRangeLabel()}</span>
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <div key={day.date.toISOString()} className="grid grid-cols-[52px_1fr] items-center gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{day.label}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {Math.round(day.committedMinutes / 60)}h
              </p>
            </div>
            <div className="relative h-12 overflow-hidden rounded-full border border-slate-200/80 bg-white/80">
              {day.segments.map((segment, index) => (
                <div
                  key={`${index}-${segment.kind}-${segment.startMinute}`}
                  className={cn(
                    "absolute top-1/2 h-7 -translate-y-1/2 rounded-full",
                    segment.kind === "event" &&
                      EVENT_TYPE_TINTS[segment.eventType ?? "unknown"],
                    segment.kind === "open" && "bg-transparent",
                    segment.emphasis === "focus" &&
                      "border border-slate-500/40 bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]",
                    segment.emphasis === "fragmented" &&
                      "border border-dashed border-slate-300 bg-slate-100/60",
                  )}
                  style={segmentStyle(segment)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-[22px] border border-slate-200/70 bg-white/72 px-4 py-4">
        <div className="flex flex-wrap gap-3">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.eventType} className="inline-flex items-center gap-2 text-xs text-slate-600">
              <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_TYPE_TINTS[item.eventType])} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs leading-6 text-slate-500">
          Filled blocks show broad event categories. Outlined gaps are the cleaner windows for focus;
          dashed gaps look open but are likely to be less reliable.
        </p>
      </div>
    </div>
  );
}
