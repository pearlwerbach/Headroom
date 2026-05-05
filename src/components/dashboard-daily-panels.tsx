"use client";

import { useMemo, useState } from "react";
import { SITE_COPY } from "@/lib/copy";
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
      row: "border-[rgba(31,41,51,0.10)] bg-white",
      bar: "bg-[#D8A7A7]",
      text: "text-[#866477]",
    };
  }

  if (score >= 45) {
    return {
      row: "border-[rgba(31,41,51,0.10)] bg-white",
      bar: "bg-[#E2B46A]",
      text: "text-[#7b654b]",
    };
  }

  return {
    row: "border-[rgba(31,41,51,0.10)] bg-white",
    bar: "bg-[#7BAA8D]",
    text: "text-[#5d7667]",
  };
}

function getDayAccentClasses(mode: DailyLoadScore["operatingMode"]) {
  switch (mode) {
    case "fragmented":
      return {
        badge: "border-transparent bg-[#F1E4E8] text-[#8A5F6D]",
        progress: "bg-[#B78393]",
        score: "border-[#D8B6C1] bg-[#FAF2F5] text-[#8A5F6D]",
        ring: "ring-[#B78393]/45",
        hover: "hover:border-[#D8B6C1]",
      };
    case "protected_work":
      return {
        badge: "border-transparent bg-[#F3E7D2] text-[#8A6335]",
        progress: "bg-[#D8A850]",
        score: "border-[#E6C992] bg-[#FCF7EE] text-[#8A6335]",
        ring: "ring-[#D8A850]/38",
        hover: "hover:border-[#E0C088]",
      };
    case "follow_through":
      return {
        badge: "border-transparent bg-[rgba(216,167,167,0.18)] text-[#866477]",
        progress: "bg-[#D8A7A7]",
        score: "border-[#E7CACA] bg-[#FCF5F5] text-[#866477]",
        ring: "ring-[#D8A7A7]/40",
        hover: "hover:border-[#D8A7A7]",
      };
    case "open_capacity":
      return {
        badge: "border-transparent bg-[rgba(123,170,141,0.18)] text-[#56735f]",
        progress: "bg-[#7BAA8D]",
        score: "border-[#D7E5DC] bg-[#F4FBF6] text-[#56735f]",
        ring: "ring-[#7BAA8D]/38",
        hover: "hover:border-[#BFD5C5]",
      };
    case "recover":
      return {
        badge: "border-transparent bg-[rgba(183,169,214,0.18)] text-[#6d5f8b]",
        progress: "bg-[#A992C9]",
        score: "border-[#D9D0EC] bg-[#F7F4FD] text-[#6d5f8b]",
        ring: "ring-[#A992C9]/38",
        hover: "hover:border-[#D0C5E5]",
      };
    default:
      return {
        badge: "border-transparent bg-[#F3E7D2] text-[#8A6335]",
        progress: "bg-[#D8A850]",
        score: "border-[#E6C992] bg-[#FCF7EE] text-[#8A6335]",
        ring: "ring-[#D8A850]/38",
        hover: "hover:border-[#E0C088]",
      };
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
  return getDayAccentClasses(mode).badge;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatWeekRange(start: Date, end: Date) {
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(start);
    return `${month} ${start.getDate()}-${end.getDate()}`;
  }

  return `${formatMonthDay(start)}-${formatMonthDay(end)}`;
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
        "rounded-[30px] border px-7 py-6 shadow-[var(--surface-shadow)]",
        getWeekLoadClasses(weekLoadSummary.tone),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9C6D3]">
            {SITE_COPY.dashboard.COPY_DASHBOARD_WEEKLOAD_EYEBROW_01}
          </p>
          <h2 className="font-serif text-[2.5rem] leading-none text-white">
            {weekLoadSummary.label}
          </h2>
        </div>
        <p className="shrink-0 text-[2.7rem] font-semibold tracking-tight text-[#FFFFFF]">
          {weekLoadSummary.score}
          <span className="ml-1 text-base font-medium text-[#C9C6D3]">/100</span>
        </p>
      </div>
      <p className="mt-5 text-[15px] leading-[1.75] text-[#FFFFFF]">
        {weekLoadSummary.interpretation}
      </p>
      <p className="mt-3 text-[14px] leading-[1.75] text-[#C9C6D3]">
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
  const trajectoryDateRange = useMemo(() => {
    const sortedByDate = [...days].sort((left, right) => left.date.getTime() - right.date.getTime());
    const start = sortedByDate[0]?.date;
    const end = sortedByDate[sortedByDate.length - 1]?.date;

    if (!start || !end) {
      return null;
    }

    return formatWeekRange(start, end);
  }, [days]);
  const activeIndex = hoveredIndex ?? selectedIndex ?? 0;
  const activeDay = weekDays[activeIndex]?.day ?? null;

  return (
    <section className="relative rounded-[36px] border border-[#E8E2DB] bg-white px-7 pb-8 pt-8 shadow-[var(--surface-shadow)] backdrop-blur md:px-8 md:pb-9 md:pt-9">
      <div className="lg:hidden">
        <WeekLoadLens
          weekLoadSummary={weekLoadSummary}
          profilePlanningInsight={profilePlanningInsight}
          className="mb-5"
        />
      </div>

      <div className="grid gap-6 lg:min-h-[11rem] lg:grid-cols-[minmax(0,0.88fr)_28.5rem] lg:items-center lg:gap-8 xl:grid-cols-[minmax(0,0.84fr)_30rem]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              {SITE_COPY.dashboard.COPY_DASHBOARD_TRAJECTORY_EYEBROW_01}
            </p>
            {trajectoryDateRange ? (
              <p className="text-[11px] font-medium tracking-[0.02em] text-slate-500">
                · {trajectoryDateRange}
              </p>
            ) : null}
          </div>
          <h1 className="max-w-[17ch] font-serif text-[1.86rem] leading-[1.06] text-slate-950 md:text-[2.05rem] xl:text-[2.18rem]">
            {SITE_COPY.dashboard.COPY_DASHBOARD_TRAJECTORY_TITLE_01}
          </h1>
        </div>

        <div className="hidden lg:block lg:justify-self-end">
          <WeekLoadLens
            weekLoadSummary={weekLoadSummary}
            profilePlanningInsight={profilePlanningInsight}
            className="w-full max-w-[30rem]"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-3">
        {weekDays.map(({ day, index }) => {
          const tone = getTone(day.score);
          const accent = getDayAccentClasses(day.operatingMode);
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
                "grid min-h-[10rem] w-full gap-3.5 rounded-[22px] border px-4 py-5 text-left transition shadow-[0_10px_24px_rgba(31,41,51,0.05)]",
                tone.row,
                active
                  ? cn("shadow-[var(--surface-shadow)] ring-1", accent.ring)
                  : cn(accent.hover, "hover:shadow-[var(--surface-shadow)]"),
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
                <span
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-full border text-[13px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.04)]",
                    accent.score,
                  )}
                >
                  {day.score}
                </span>
              </div>

              <div className="space-y-1.5">
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
                    className={cn("h-full rounded-full", accent.progress)}
                    style={{ width: `${Math.max(10, Math.min(100, day.score))}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[28px] border border-[#E8E2DB] bg-[#F5F1EB] px-6 py-6 md:px-7 md:py-6.5">
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              {SITE_COPY.dashboard.COPY_DASHBOARD_TODAY_SUPPORTS_01}
            </p>
            {weekTrajectorySummary ? (
              <div className="max-w-3xl border-l-[3px] border-[#AEBEAF] pl-4">
                <p className="max-w-2xl text-[16px] leading-[1.65] text-[#1F1F23]">
                  {weekTrajectorySummary.headline}
                </p>
              </div>
            ) : null}
          </div>
          {activeDay ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[rgba(31,31,35,0.84)]">{activeDay.label}</p>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    getModeClasses(activeDay.operatingMode),
                  )}
                >
                  {activeDay.modeTitle}
                </span>
                <span className="text-sm font-medium text-[rgba(31,31,35,0.7)]">
                  {SITE_COPY.dashboard.COPY_DASHBOARD_DAY_LOAD_LABEL_01(activeDay.score)}
                </span>
              </div>
              <p className="max-w-3xl text-[17px] leading-[1.6] text-[#1F1F23]">
                {activeDay.modeMeaning}
              </p>
            </>
          ) : null}
        </div>

        {activeDay ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.02fr_0.98fr] xl:items-start xl:gap-9">
            <ul className="space-y-4 text-[15px] leading-[1.65] text-[rgba(31,31,35,0.72)]">
              {activeDay.modeActions.slice(0, 2).map((action) => (
                <li key={action} className="flex items-start gap-2">
                  <span className="mt-[0.7em] h-1.5 w-1.5 rounded-full bg-[#98AA9A]" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[rgba(31,31,35,0.12)] pt-4 xl:mt-0 xl:self-start">
              <p className="max-w-2xl text-sm italic leading-[1.65] text-[rgba(31,31,35,0.56)]">
                {activeDay.modeReframe}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[rgba(31,31,35,0.56)]">
            {SITE_COPY.dashboard.COPY_DASHBOARD_DAY_EMPTY_01}
          </p>
        )}
      </div>
    </section>
  );
}
