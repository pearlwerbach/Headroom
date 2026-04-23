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
      row: "border-[#E8E2DB] bg-white",
      bar: "bg-[#D8A7A7]",
      text: "text-[#866477]",
    };
  }

  if (score >= 45) {
    return {
      row: "border-[#E8E2DB] bg-white",
      bar: "bg-[#E2B46A]",
      text: "text-[#7b654b]",
    };
  }

  return {
    row: "border-[#E8E2DB] bg-white",
    bar: "bg-[#7BAA8D]",
    text: "text-[#5d7667]",
  };
}

function getWeekLoadClasses(tone: WeekLoadSummaryCard["tone"]) {
  switch (tone) {
    case "alert":
      return "border-[#2C2A3A] bg-[#2C2A3A] text-[#FFFFFF]";
    case "warm":
      return "border-[#2C2A3A] bg-[#2C2A3A] text-[#FFFFFF]";
    case "success":
    default:
      return "border-[#2C2A3A] bg-[#2C2A3A] text-[#FFFFFF]";
  }
}

function getModeClasses(mode: DailyLoadScore["operatingMode"]) {
  switch (mode) {
    case "absorb":
      return "border-transparent bg-[rgba(216,167,167,0.18)] text-[#866477]";
    case "build":
      return "border-transparent bg-[rgba(123,170,141,0.18)] text-[#56735f]";
    case "recover":
      return "border-transparent bg-[rgba(183,169,214,0.18)] text-[#6d5f8b]";
    case "protect":
    default:
      return "border-transparent bg-[rgba(226,180,106,0.22)] text-[#86633b]";
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
        "rounded-[28px] border px-5 py-4 shadow-[var(--surface-shadow)]",
        getWeekLoadClasses(weekLoadSummary.tone),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9C6D3]">
            Week load
          </p>
          <h2 className="font-serif text-[2.2rem] leading-none text-white">
            {weekLoadSummary.label}
          </h2>
        </div>
        <p className="shrink-0 text-[2.4rem] font-semibold tracking-tight text-[#FFFFFF]">
          {weekLoadSummary.score}
          <span className="ml-1 text-base font-medium text-[#C9C6D3]">/100</span>
        </p>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#FFFFFF]">
        {weekLoadSummary.interpretation}
      </p>
      <p className="mt-3 text-sm leading-7 text-[#C9C6D3]">
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
    <section className="relative rounded-[36px] border border-[#E8E2DB] bg-white px-6 pb-6 pt-8 shadow-[var(--surface-shadow)] backdrop-blur md:px-7 md:pb-7 md:pt-9">
      <div className="lg:hidden">
        <WeekLoadLens
          weekLoadSummary={weekLoadSummary}
          profilePlanningInsight={profilePlanningInsight}
        />
      </div>

      <div className="grid gap-5 lg:min-h-[9.5rem] lg:grid-cols-[minmax(0,1fr)_24.5rem] lg:items-center">
        <div className="space-y-1.5">
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

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
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
                "grid min-h-[8.75rem] w-full gap-3 rounded-[22px] border px-3.5 py-3.5 text-left transition",
                tone.row,
                active
                  ? "shadow-[var(--surface-shadow)] ring-1 ring-[#B7A9D6]/60"
                  : "hover:border-[#D8A7A7] hover:shadow-[var(--surface-shadow)]",
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
                <div className="h-1.5 overflow-hidden rounded-full bg-[#F3EDE6]">
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

      <div className="mt-5 rounded-[28px] border border-[#E8E2DB] bg-[#EFE7DF] px-5 py-5 md:px-6">
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
