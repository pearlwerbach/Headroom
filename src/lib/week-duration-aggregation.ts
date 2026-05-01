import { addDays, eachDayOfInterval } from "date-fns";
import { minutesBetween, startOfLocalDay } from "@/lib/utils";

export interface CategorizedDurationEvent<Category extends string> {
  title?: string;
  sourceCalendarId?: string;
  startTime: Date;
  endTime: Date;
  resolvedCategory: Category | null;
}

export interface CategorizedDurationDebugEvent<Category extends string> {
  title: string;
  sourceCalendar: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  resolvedCategory: Category | null;
}

export interface CategorizedDurationResult<Category extends string> {
  totals: Record<Category, number>;
  debugEvents: CategorizedDurationDebugEvent<Category>[];
  grandTotalHours: number;
  categorizedEventCount: number;
  overlapRule: string;
}

function clipToRange(startTime: Date, endTime: Date, rangeStart: Date, rangeEnd: Date) {
  const clippedStart = startTime < rangeStart ? rangeStart : startTime;
  const clippedEnd = endTime > rangeEnd ? rangeEnd : endTime;

  if (clippedEnd <= clippedStart) {
    return null;
  }

  return {
    startTime: clippedStart,
    endTime: clippedEnd,
  };
}

export function aggregateCategorizedDurations<Category extends string>(
  events: CategorizedDurationEvent<Category>[],
  {
    categories,
    priority,
    rangeStart,
    rangeEnd,
  }: {
    categories: Category[];
    priority: Category[];
    rangeStart: Date;
    rangeEnd: Date;
  },
): CategorizedDurationResult<Category> {
  const totals = Object.fromEntries(categories.map((category) => [category, 0])) as Record<Category, number>;
  const clippedEvents = events.flatMap((event) => {
    const clipped = clipToRange(event.startTime, event.endTime, rangeStart, rangeEnd);

    if (!clipped) {
      return [];
    }

    return [{
      ...event,
      ...clipped,
    }];
  });

  const debugEvents = clippedEvents.map((event) => ({
    title: event.title ?? "",
    sourceCalendar: event.sourceCalendarId ?? "unknown",
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    durationHours: Math.round((minutesBetween(event.startTime, event.endTime) / 60) * 100) / 100,
    resolvedCategory: event.resolvedCategory,
  }));

  const categorizedEvents = clippedEvents.filter(
    (event): event is typeof event & { resolvedCategory: Category } => event.resolvedCategory !== null,
  );

  const startDay = startOfLocalDay(rangeStart);
  const endDay = startOfLocalDay(rangeEnd);
  const days = eachDayOfInterval({
    start: startDay,
    end: addDays(endDay, -1),
  });

  for (const day of days) {
    const dayStart = startOfLocalDay(day);
    const dayEnd = addDays(dayStart, 1);
    const dayEvents = categorizedEvents.flatMap((event) => {
      const clipped = clipToRange(event.startTime, event.endTime, dayStart, dayEnd);

      if (!clipped) {
        return [];
      }

      return [{
        ...event,
        ...clipped,
      }];
    });

    if (dayEvents.length === 0) {
      continue;
    }

    const boundaries = Array.from(
      new Set(
        [dayStart.getTime(), dayEnd.getTime(), ...dayEvents.flatMap((event) => [
          event.startTime.getTime(),
          event.endTime.getTime(),
        ])],
      ),
    ).sort((left, right) => left - right);

    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const segmentStart = new Date(boundaries[index]!);
      const segmentEnd = new Date(boundaries[index + 1]!);
      const activeEvents = dayEvents.filter(
        (event) => event.startTime < segmentEnd && event.endTime > segmentStart,
      );

      if (activeEvents.length === 0) {
        continue;
      }

      const chosenEvent = [...activeEvents].sort(
        (left, right) =>
          priority.indexOf(left.resolvedCategory) - priority.indexOf(right.resolvedCategory),
      )[0]!;

      totals[chosenEvent.resolvedCategory] += minutesBetween(segmentStart, segmentEnd);
    }
  }

  const grandTotalHours = Math.round(
    ((Object.values(totals) as number[]).reduce((sum, minutes) => sum + minutes, 0) / 60) * 100,
  ) / 100;

  return {
    totals,
    debugEvents,
    grandTotalHours,
    categorizedEventCount: categorizedEvents.length,
    overlapRule:
      "Overlapping events are counted once by assigning each visible minute to the highest-priority matching category in the analyzed seven-day window.",
  };
}
