import type { DailyLoadScore } from "@/lib/domain";
import { cn } from "@/lib/utils";

function getTone(score: number) {
  if (score >= 70) {
    return "bg-rose-400/85";
  }

  if (score >= 45) {
    return "bg-amber-400/85";
  }

  return "bg-emerald-400/85";
}

function getModeClasses(mode: DailyLoadScore["operatingMode"]) {
  switch (mode) {
    case "absorb":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "build":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "recover":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "protect":
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

export function DailyLoadTrajectory({
  days,
}: {
  days: DailyLoadScore[];
}) {
  return (
    <div className="space-y-4">
      {days.map((day) => (
        <article
          key={day.date.toISOString()}
          className="rounded-[22px] border border-slate-200/80 bg-white/72 px-4 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    getModeClasses(day.operatingMode),
                  )}
                >
                  {day.modeTitle}
                </span>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-700">{day.modeMeaning}</p>
            </div>
            <div className="min-w-[64px] text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Load</p>
              <p className="text-lg font-semibold text-slate-900">{day.score}</p>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full", getTone(day.score))}
              style={{ width: `${Math.max(4, Math.min(100, day.score))}%` }}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {day.modeActions.map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <p className="max-w-xs text-sm leading-6 text-slate-500 lg:text-right">{day.modeReframe}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
