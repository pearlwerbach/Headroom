"use client";

import { useMemo, useState } from "react";
import type { DailyLoadScore } from "@/lib/domain";
import { cn } from "@/lib/utils";

function getTone(score: number) {
  if (score >= 70) {
    return {
      chip: "border-rose-200 bg-rose-50 text-rose-800",
      accent: "bg-rose-400/80",
      wash: "bg-rose-100/65",
    };
  }

  if (score >= 45) {
    return {
      chip: "border-amber-200 bg-amber-50 text-amber-800",
      accent: "bg-amber-400/80",
      wash: "bg-amber-100/65",
    };
  }

  return {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    accent: "bg-emerald-400/80",
    wash: "bg-emerald-100/60",
  };
}

function getModeClasses(mode: DailyLoadScore["operatingMode"]) {
  switch (mode) {
    case "follow_through":
      return "border-slate-200 bg-slate-100 text-slate-800";
    case "open_capacity":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "recover":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "fragmented":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "protected_work":
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatDayNumber(date: Date) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
}

export function DailyLoadTrajectory({
  days,
}: {
  days: DailyLoadScore[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeDay = activeIndex === null ? null : (days[activeIndex] ?? null);
  const calendarDays = useMemo(() => days.map((day, index) => ({ day, index })), [days]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {calendarDays.map(({ day, index }) => {
          const tone = getTone(day.score);
          const active = index === activeIndex;

          return (
            <button
              key={day.date.toISOString()}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "group rounded-[22px] border px-3 py-3 text-left transition",
                tone.chip,
                active
                  ? "shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] ring-1 ring-slate-300/60"
                  : "hover:border-slate-300 hover:shadow-[0_18px_34px_-30px_rgba(15,23,42,0.35)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {formatWeekday(day.date)}
                  </p>
                  <p className="mt-1 font-serif text-2xl leading-none text-slate-950">
                    {formatDayNumber(day.date)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{day.score}</p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70">
                <div
                  className={cn("h-full rounded-full", tone.accent)}
                  style={{ width: `${Math.max(8, Math.min(100, day.score))}%` }}
                />
              </div>
              <div className="mt-3 space-y-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    getModeClasses(day.operatingMode),
                  )}
                >
                  {day.modeTitle}
                </span>
                <div className={cn("h-7 rounded-[14px]", tone.wash)} />
              </div>
            </button>
          );
        })}
      </div>

      {activeDay ? (
        <section className="rounded-[24px] border border-slate-200/80 bg-white/78 px-5 py-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.42)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{activeDay.label}</p>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    getModeClasses(activeDay.operatingMode),
                  )}
                >
                  {activeDay.modeTitle}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-700">{activeDay.modeMeaning}</p>
            </div>
            <p className="text-sm font-medium text-slate-500">Load {activeDay.score}</p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {activeDay.modeActions.map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <p className="max-w-sm text-sm leading-6 text-slate-500 lg:text-right">
              {activeDay.modeReframe}
            </p>
          </div>
        </section>
      ) : (
        <p className="text-sm leading-6 text-slate-500">
          Hover or tap a day to see what kind of effort it can realistically support.
        </p>
      )}
    </div>
  );
}
