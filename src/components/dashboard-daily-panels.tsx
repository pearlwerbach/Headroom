"use client";

import { useMemo, useState } from "react";
import type { DailyLoadScore } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface WeekLoadSummaryCard {
  score: number;
  label: string;
  tone: "success" | "warm" | "alert";
  interpretation: string;
}

interface WeekTrajectorySummaryCard {
  headline: string;
  details: string[];
}

function getTone(score: number) {
  if (score >= 70) {
    return {
      row: "border-rose-200/80 bg-rose-50/72",
      bar: "bg-rose-400/85",
      text: "text-rose-800",
    };
  }

  if (score >= 45) {
    return {
      row: "border-amber-200/80 bg-amber-50/72",
      bar: "bg-amber-400/85",
      text: "text-amber-800",
    };
  }

  return {
    row: "border-emerald-200/80 bg-emerald-50/72",
    bar: "bg-emerald-400/85",
    text: "text-emerald-800",
  };
}

function getWeekLoadClasses(tone: WeekLoadSummaryCard["tone"]) {
  switch (tone) {
    case "alert":
      return "border-[#65556d] bg-[#343246] text-white";
    case "warm":
      return "border-[#65556d] bg-[#343246] text-white";
    case "success":
    default:
      return "border-[#65556d] bg-[#343246] text-white";
  }
}

function getModeClasses(mode: DailyLoadScore["operatingMode"]) {
  switch (mode) {
    case "absorb":
      return "border-slate-200 bg-slate-100 text-slate-800";
    case "build":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "recover":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "protect":
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function WeekLoadLens({
  weekLoadSummary,
  profilePlanningInsight,
  className,
}: {
  weekLoadSummary: WeekLoadSummaryCard;
  profilePlanningInsight: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border px-5 py-4 shadow-[0_32px_84px_-42px_rgba(24,28,46,0.46)]",
        getWeekLoadClasses(weekLoadSummary.tone),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
            Week load
          </p>
          <h2 className="font-serif text-[2.2rem] leading-none text-white">
            {weekLoadSummary.label}
          </h2>
        </div>
        <p className="shrink-0 text-[2.4rem] font-semibold tracking-tight text-white">
          {weekLoadSummary.score}
          <span className="ml-1 text-base font-medium text-white/60">/100</span>
        </p>
      </div>
      <p className="mt-4 text-sm leading-7 text-white/88">
        {weekLoadSummary.interpretation}
      </p>
      <p className="mt-3 text-sm leading-7 text-white/68">
        {profilePlanningInsight}
      </p>
    </div>
  );
}

export function DashboardDailyPanels({
  days,
  weekLoadSummary,
  profilePlanningInsight,
  weekTrajectorySummary,
}: {
  days: DailyLoadScore[];
  weekLoadSummary: WeekLoadSummaryCard;
  profilePlanningInsight: string;
  weekTrajectorySummary?: WeekTrajectorySummaryCard | null;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const weekDays = useMemo(
    () =>
      days
        .map((day) => ({ day }))
        .sort((left, right) => left.day.date.getDay() - right.day.date.getDay())
        .map((entry, index) => ({ ...entry, index })),
    [days],
  );
  const activeIndex = hoveredIndex ?? selectedIndex ?? 0;
  const activeDay = weekDays[activeIndex]?.day ?? null;

  return (
    <section className="relative rounded-[36px] border border-white/55 bg-white/88 px-6 py-6 shadow-[0_32px_80px_-46px_rgba(15,23,42,0.44)] backdrop-blur md:px-7 md:py-7">
      <div className="lg:hidden">
        <WeekLoadLens
          weekLoadSummary={weekLoadSummary}
          profilePlanningInsight={profilePlanningInsight}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24.5rem] lg:items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            Week trajectory
          </p>
          <h1 className="font-serif text-4xl leading-tight text-slate-950 md:text-[2.75rem]">
            How capacity shifts across the week
          </h1>
        </div>

        <div className="hidden lg:block">
          <WeekLoadLens
            weekLoadSummary={weekLoadSummary}
            profilePlanningInsight={profilePlanningInsight}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2.5">
        {weekDays.map(({ day, index }) => {
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
                "grid w-full gap-2.5 rounded-[22px] border px-3 py-3 text-left transition",
                tone.row,
                active
                  ? "shadow-[0_22px_48px_-36px_rgba(15,23,42,0.34)] ring-1 ring-slate-300/60"
                  : "hover:border-slate-300/90 hover:shadow-[0_18px_36px_-34px_rgba(15,23,42,0.22)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {formatWeekday(day.date)}
                  </p>
                  <p className="font-serif text-[1.18rem] leading-none text-slate-950">
                    {formatMonthDay(day.date)}
                  </p>
                </div>
                <span className={cn("text-[13px] font-semibold", tone.text)}>{day.score}</span>
              </div>

              <div className="space-y-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]",
                    getModeClasses(day.operatingMode),
                  )}
                >
                  {day.modeTitle}
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div
                    className={cn("h-full rounded-full", tone.bar)}
                    style={{ width: `${Math.max(10, Math.min(100, day.score))}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200/80 bg-slate-50/88 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              What today supports
            </p>
            {weekTrajectorySummary ? (
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {weekTrajectorySummary.headline}
              </p>
            ) : null}
            {activeDay ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{activeDay.label}</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                      getModeClasses(activeDay.operatingMode),
                    )}
                  >
                    {activeDay.modeTitle}
                  </span>
                  <span className="text-sm font-medium text-slate-500">Load {activeDay.score}</span>
                </div>
                <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
                  {activeDay.modeMeaning}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {activeDay ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <ul className="space-y-2 text-sm leading-7 text-slate-700">
              {activeDay.modeActions.slice(0, 2).map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 lg:pl-4">
              {activeDay.modeReframe}
            </p>
          </div>
        ) : (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
            Hover or tap a day above to see what kind of effort it can realistically support.
          </p>
        )}
      </div>
    </section>
  );
}
