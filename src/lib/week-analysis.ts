import { addDays, addHours, eachDayOfInterval, format, set } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_DAYS,
  DEFAULT_SLEEP_HOUR,
  DEFAULT_WAKE_HOUR,
  WEEK_ANALYSIS_CACHE_HOURS,
} from "@/lib/constants";
import { getPlanningReadyCognitiveProfile } from "@/lib/cognitive-profile";
import type {
  ClassifiedWeekEvent,
  CognitiveProfileSnapshot,
  DailyLoadDebug,
  DailyLoadScore,
  EphemeralGoogleEvent,
  WeekAnalysisMetrics,
  WeekAnalysisReportSnapshot,
  WeekEventType,
  WeeklyLoadDebug,
  WeekShapeDay,
  WeekShapeSegment,
} from "@/lib/domain";
import {
  fetchEphemeralSelectedCalendarEvents,
  fetchReadableGoogleCalendars,
  resolveIncludedGoogleCalendarIds,
  type GoogleReadableCalendar,
} from "@/lib/google-calendar";
import { classifyWeekEventTitle } from "@/lib/week-event-classification";
import { clamp, minutesBetween, startOfLocalDay } from "@/lib/utils";

type WorkProfileRow = NonNullable<Awaited<ReturnType<typeof prisma.workProfile.findFirst>>>;
type WeekAnalysisRow = Awaited<ReturnType<typeof prisma.weekAnalysisReport.findUnique>>;
type WeekAnalysisHistoryRow = Awaited<ReturnType<typeof prisma.weekAnalysisHistory.findMany>>[number];
type GoogleAccountRow = Awaited<ReturnType<typeof prisma.account.findFirst>>;

type PersistedClassifiedWeekEvent = Omit<ClassifiedWeekEvent, "startTime" | "endTime"> & {
  startTime: string;
  endTime: string;
};

type PersistedWeekShapeDay = Omit<WeekShapeDay, "date"> & { date: string };
type PersistedDailyLoadScore = Omit<DailyLoadScore, "date"> & { date: string };
type PersistedDailyLoadDebug = Omit<DailyLoadDebug, "date"> & { date: string };
type PersistedWeekAnalysisMetrics = Omit<WeekAnalysisMetrics, "weekShapeDays"> & {
  weekShapeDays: PersistedWeekShapeDay[];
  dailyLoadScores: PersistedDailyLoadScore[];
  dailyLoadDebug: PersistedDailyLoadDebug[];
};

const EMPTY_WEEK_ANALYSIS_METRICS: WeekAnalysisMetrics = {
  totalCommittedMinutes: 0,
  totalOpenMinutes: 0,
  overallLoadScore: 0,
  scheduledLoadScore: 0,
  latentDemandMinutes: 0,
  availableMarginMinutes: 0,
  committedHoursByDay: [],
  dailyLoadScores: [],
  dailyLoadDebug: [],
  weeklyLoadDebug: {
    scheduledWeeklyRawScoreBeforeLatent: 0,
    evaluativeLoadContribution: 0,
    anticipatoryExamContribution: 0,
    latentDemandContribution: 0,
    summedDailyRawScore: 0,
    averageDailyRawScore: 0,
    multiDayPatternPenalties: 0,
    weeklyAggregationPenalty: 0,
    recoveryCredits: 0,
    weeklyStabilizingCredits: 0,
    supportFactor: 1,
    weeklyRawScoreBeforeScaling: 0,
    finalWeeklyDisplayScore: 0,
  },
  freeBlocksByDay: [],
  medianFreeBlockMinutes: 0,
  freeBlockCount30: 0,
  freeBlockCount60: 0,
  freeBlockCount90: 0,
  fragmentationBurden: 0,
  protectedBlockAvailability: 0,
  loadConcentration: 0,
  morningUsableMinutes: 0,
  afternoonUsableMinutes: 0,
  transitionDensity: 0,
  eventTypeCounts: {},
  externallyStructuredCount: 0,
  socialCount: 0,
  exerciseCount: 0,
  workClassMinutes: 0,
  meetingsStructuredMinutes: 0,
  socialMinutes: 0,
  recoverySoloMinutes: 0,
  squeezedOpenBlockCount: 0,
  bufferedOpenBlockCount: 0,
  weekShapeDays: [],
};

interface MergedInterval {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

interface OpenBlock {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  squeezed: boolean;
  focusCompatible: boolean;
  emphasizedAsFragmented: boolean;
}

interface DayAnalysis {
  label: string;
  date: Date;
  committedMinutes: number;
  eventCount: number;
  switchCount: number;
  categorySwitchCount: number;
  transitionBurden: number;
  longestGapMinutes: number;
  protectedBlockCount: number;
  fragmentedWindowCount: number;
  freeBlockCount: number;
  morningUsableMinutes: number;
  afternoonUsableMinutes: number;
  structuredEventCount: number;
  socialCount: number;
  exerciseCount: number;
  socialMinutes: number;
  supportMinutes: number;
  explicitRecoveryMinutes: number;
  events: ClassifiedWeekEvent[];
  openBlocks: OpenBlock[];
  eventTypeCounts: Partial<Record<WeekEventType, number>>;
  weekShapeDay: WeekShapeDay;
}

export interface WeekAnalysisDashboardState {
  profile: WorkProfileRow | null;
  normalizedProfile: CognitiveProfileSnapshot | null;
  googleAccount: GoogleAccountRow | null;
  googleConnected: boolean;
  selectedCalendarIds: string[];
  availableCalendars: GoogleReadableCalendar[];
  report: WeekAnalysisReportSnapshot | null;
}

export interface WeekAnalysisHistoryEntry {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  analyzedAt: Date;
  overallLoadScore: number;
  observations: string[];
  suggestions: string[];
  derivedMetrics: WeekAnalysisMetrics;
}

const EXTERNALLY_STRUCTURED_TYPES = new Set<WeekEventType>([
  "class",
  "evaluative",
  "work_meeting",
  "appointment",
]);
const SUPPORTIVE_EVENT_TYPES = new Set<WeekEventType>([
  "social",
  "exercise",
  "meal",
  "personal_care",
  "errand",
]);
const MAX_DISPLAY_LOAD_SCORE = 99;
const LOAD_SCORE_ANCHORS = [
  { raw: 0, display: 0 },
  { raw: 2, display: 15 },
  { raw: 5, display: 31 },
  { raw: 10, display: 46 },
  { raw: 20, display: 60 },
  { raw: 40, display: 78 },
  { raw: 60, display: 88 },
  { raw: 70, display: 92 },
  { raw: 90, display: 97 },
  { raw: 120, display: MAX_DISPLAY_LOAD_SCORE },
] as const;

function buildDayBoundary(date: Date, hour: number) {
  return set(date, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
}

function normalizePlanningProfile(profile: WorkProfileRow) {
  return getPlanningReadyCognitiveProfile(profile);
}

function getDesiredBlockMinutes(profile: CognitiveProfileSnapshot) {
  if (profile.fragmentationCost >= 4 || profile.transitionCost >= 4) {
    return 120;
  }

  if (profile.deepWorkCapacity <= 2) {
    return 60;
  }

  return 90;
}

function getRunwayMinutes(profile: CognitiveProfileSnapshot) {
  if (profile.transitionCost >= 4) {
    return 30;
  }

  if (profile.transitionCost <= 2) {
    return 10;
  }

  return 20;
}

function getHeavyDayMinutes(profile: CognitiveProfileSnapshot) {
  if (profile.overloadSensitivity >= 4 || profile.overcommitmentRisk >= 4) {
    return 300;
  }

  return 360;
}

function getDayLabel(date: Date) {
  return format(date, "EEEE");
}

function getDayPartLabel(date: Date) {
  return date.getHours() < 12 ? "morning" : date.getHours() < 17 ? "afternoon" : "evening";
}

function getWeekWindow(now = new Date()) {
  const weekStart = startOfLocalDay(now);
  const weekEnd = addDays(weekStart, DASHBOARD_DAYS);

  return { weekStart, weekEnd };
}

export function toDisplayLoadScore(rawSignal: number) {
  const safeSignal = Math.max(0, finiteNumber(rawSignal));

  if (safeSignal === 0) {
    return 0;
  }

  for (let index = 1; index < LOAD_SCORE_ANCHORS.length; index += 1) {
    const previous = LOAD_SCORE_ANCHORS[index - 1];
    const next = LOAD_SCORE_ANCHORS[index];

    if (safeSignal <= next.raw) {
      const segmentProgress = (safeSignal - previous.raw) / (next.raw - previous.raw);
      const interpolated =
        previous.display + segmentProgress * (next.display - previous.display);

      return Math.max(0, Math.min(MAX_DISPLAY_LOAD_SCORE, Math.round(interpolated)));
    }
  }

  return MAX_DISPLAY_LOAD_SCORE;
}

function normalizeDisplayLoadScore(score: unknown) {
  const safeScore = finiteNumber(score);
  if (safeScore <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_DISPLAY_LOAD_SCORE, Math.round(safeScore)));
}

function getConsecutiveHighDemandDays(rawSignals: number[]) {
  let longestRun = 0;
  let currentRun = 0;

  for (const signal of rawSignals) {
    if (signal >= 24) {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return longestRun;
}

function metricsLikeTransitionDensity(totalSwitches: number, dayCount: number) {
  if (dayCount <= 0) {
    return 0;
  }

  return totalSwitches / dayCount;
}

function getAverageSignal(rawSignals: number[]) {
  if (rawSignals.length === 0) {
    return 0;
  }

  return rawSignals.reduce((sum, signal) => sum + signal, 0) / rawSignals.length;
}

function getTopSignalAverage(rawSignals: number[], count: number) {
  if (rawSignals.length === 0 || count <= 0) {
    return 0;
  }

  const topSignals = [...rawSignals].sort((left, right) => right - left).slice(0, count);
  return getAverageSignal(topSignals);
}

function countByEventType(events: ClassifiedWeekEvent[]) {
  return events.reduce<Partial<Record<WeekEventType, number>>>((counts, event) => {
    counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
    return counts;
  }, {});
}

function getEventLoadWeight(eventType: WeekEventType) {
  switch (eventType) {
    case "evaluative":
      return 9.6;
    case "class":
      return 7.4;
    case "study_work":
      return 6.1;
    case "deep_work":
      return 7.8;
    case "admin":
      return 5.4;
    case "work_meeting":
      return 5.8;
    case "appointment":
      return 4.9;
    case "commute":
      return 3.4;
    case "travel":
      return 4.2;
    case "social":
      return -0.7;
    case "exercise":
      return -3.2;
    case "meal":
      return -1.4;
    case "personal_care":
      return -1.8;
    case "errand":
      return -0.5;
    case "unknown":
    default:
      return 2.3;
  }
}

function getEventMode(eventType: WeekEventType) {
  switch (eventType) {
    case "evaluative":
    case "class":
    case "study_work":
    case "deep_work":
    case "admin":
      return "demand" as const;
    case "work_meeting":
    case "appointment":
    case "commute":
    case "travel":
      return "structured" as const;
    case "social":
    case "exercise":
    case "meal":
    case "personal_care":
    case "errand":
      return "support" as const;
    case "unknown":
    default:
      return "neutral" as const;
  }
}

function isPrimaryDemandType(eventType: WeekEventType) {
  return eventType === "class" || eventType === "deep_work" || eventType === "evaluative";
}

function isSelfDirectedWorkType(eventType: WeekEventType) {
  return eventType === "study_work";
}

function isEvaluativeType(eventType: WeekEventType) {
  return eventType === "evaluative";
}

function isStructuredObligationType(eventType: WeekEventType) {
  return (
    eventType === "work_meeting" ||
    eventType === "appointment" ||
    eventType === "commute" ||
    eventType === "travel" ||
    eventType === "admin"
  );
}

function getEventHours(day: DayAnalysis, predicate: (eventType: WeekEventType) => boolean) {
  return day.events
    .filter((event) => predicate(event.eventType))
    .reduce((sum, event) => sum + event.durationMinutes, 0) / 60;
}

function getOpenSupportSummary(day: DayAnalysis) {
  return day.openBlocks.reduce(
    (summary, block) => {
      const durationHours = block.durationMinutes / 60;
      const isLate = block.startTime.getHours() >= 20 || block.endTime.getHours() >= 22;
      const lateDiscount = isLate ? 0.45 : block.startTime.getHours() >= 18 ? 0.7 : 1;
      const ambientSupport =
        !block.squeezed && block.durationMinutes >= 30
          ? durationHours * 0.06 * lateDiscount
          : block.squeezed && block.durationMinutes >= 20
            ? durationHours * 0.015
            : 0;

      if (!block.squeezed && block.durationMinutes >= 45) {
        summary.bufferedSupport += durationHours * 0.08 * lateDiscount;
      } else if (block.squeezed && block.durationMinutes >= 45) {
        summary.squeezeRelief += durationHours * 0.02;
      }

      if (!block.squeezed && block.durationMinutes >= 100) {
        summary.explicitRecovery += Math.min(1.1, durationHours * 0.18 * lateDiscount);
      }

      if (!block.squeezed && block.durationMinutes >= 75) {
        summary.strongSupportBlocks += 1;
      }

      if (!block.squeezed) {
        summary.availableMarginMinutes += block.durationMinutes * (block.durationMinutes >= 45 ? 0.72 : 0.42);
      } else {
        summary.availableMarginMinutes += block.durationMinutes * 0.16;
      }

      summary.ambientSupport += ambientSupport;

      return summary;
    },
    {
      ambientSupport: 0,
      bufferedSupport: 0,
      explicitRecovery: 0,
      squeezeRelief: 0,
      strongSupportBlocks: 0,
      availableMarginMinutes: 0,
    },
  );
}

function getDailyOperatingMode(
  day: DayAnalysis,
  score: number,
  carryoverIn: number,
  availableMarginMinutes: number,
  profile: CognitiveProfileSnapshot,
): DailyLoadScore["operatingMode"] {
  const desiredBlockMinutes = getDesiredBlockMinutes(profile);
  const highStructure = day.structuredEventCount >= 3 || day.eventCount >= 4;
  const highTransitions = day.transitionBurden >= 2.5 || day.switchCount + day.categorySwitchCount >= 4;
  const lowRunway =
    day.protectedBlockCount === 0 ||
    day.longestGapMinutes < desiredBlockMinutes ||
    day.fragmentedWindowCount >= 2 ||
    availableMarginMinutes < 110;
  const strongRunway =
    day.protectedBlockCount >= 2 || availableMarginMinutes >= 210 || day.longestGapMinutes >= desiredBlockMinutes + 35;
  const moderateRunway =
    day.protectedBlockCount >= 1 || availableMarginMinutes >= 120 || day.longestGapMinutes >= desiredBlockMinutes;
  const visibleRecovery =
    day.explicitRecoveryMinutes >= 45 ||
    day.supportMinutes >= 90 ||
    (availableMarginMinutes >= 240 && carryoverIn >= 1);
  const lowDemand = score <= 22 && day.committedMinutes <= 180;
  const highCarryover = carryoverIn >= 1.8 || (carryoverIn >= 1.2 && score <= 36);

  if ((highCarryover && availableMarginMinutes >= 120) || (lowDemand && visibleRecovery && day.structuredEventCount <= 2)) {
    return "recover";
  }

  if ((highStructure && highTransitions && lowRunway) || (score >= 65 && day.structuredEventCount >= 3 && !moderateRunway)) {
    return "absorb";
  }

  if (score <= 58 && strongRunway && day.structuredEventCount <= 1 && day.eventCount <= 2 && carryoverIn < 1.4) {
    return "build";
  }

  return "protect";
}

function getDailyOperatingModeCopy(
  mode: DailyLoadScore["operatingMode"],
  profile: CognitiveProfileSnapshot,
) {
  const protectedWindowLabel = profile.fragmentationCost >= 4 || profile.transitionCost >= 4
    ? "one clean runway"
    : "one real work block";

  switch (mode) {
    case "absorb":
      return {
        title: "Absorb Day",
        meaning:
          "The day is best used to move through commitments and follow-through, not to force deep work between transitions.",
        actions: [
          "Let classes, meetings, and logistics be the main job of the day.",
          "Use shorter gaps for admin, review, setup, or simple follow-through.",
          "Do not ask this day to hold your most open-ended work.",
        ],
        reframe: "A good Absorb Day is one that carries the schedule cleanly without making you fight it.",
      };
    case "build":
      return {
        title: "Build Day",
        meaning:
          "This day has enough continuity to support deeper work, studying, and open-ended thinking.",
        actions: [
          "Place your most demanding work in the clearest continuous window.",
          "Keep lighter admin and messages at the edges instead of inside the best block.",
          "Start within the usable window you already have rather than waiting for a more perfect day.",
        ],
        reframe: "Use the day to build momentum while the schedule can still hold it.",
      };
    case "recover":
      return {
        title: "Recover Day",
        meaning:
          "Capacity matters more than visible openness here, so recovery and lighter effort are fully valid.",
        actions: [
          "Let rest, exercise, care, or quieter catch-up take priority.",
          "If work needs to happen, keep it concrete, bounded, and lower-stakes.",
          "Treat open time as margin to protect, not pressure to fill.",
        ],
        reframe: "Protecting capacity on a Recover Day is part of the plan, not a detour from it.",
      };
    case "protect":
    default:
      return {
        title: "Protect Day",
        meaning:
          "The day can hold one meaningful priority, but it will help to choose and guard it deliberately.",
        actions: [
          `Choose ${protectedWindowLabel} and decide in advance what belongs there.`,
          "Let the rest of the day absorb lighter tasks, follow-through, and transitions.",
          "Keep extra demands from leaking into the one block that can still do real work.",
        ],
        reframe: "The goal is not to do everything today, but to keep one part of the day genuinely usable.",
      };
  }
}

function getCompressionCount(day: DayAnalysis) {
  return day.events.reduce((count, event, index, array) => {
    if (index === 0) {
      return count;
    }

    const previous = array[index - 1]!;
    const gapMinutes = minutesBetween(previous.endTime, event.startTime);
    const previousDemandLike = isPrimaryDemandType(previous.eventType) || isStructuredObligationType(previous.eventType);
    const currentDemandLike = isPrimaryDemandType(event.eventType) || isStructuredObligationType(event.eventType);

    return previousDemandLike && currentDemandLike && gapMinutes <= 25 ? count + 1 : count;
  }, 0);
}

function getTransitionPairWeight(
  previousEvent: ClassifiedWeekEvent,
  nextEvent: ClassifiedWeekEvent,
) {
  const previousMode = getEventMode(previousEvent.eventType);
  const nextMode = getEventMode(nextEvent.eventType);
  const gapMinutes = minutesBetween(previousEvent.endTime, nextEvent.startTime);
  let pairWeight = 0.85;

  if (previousEvent.eventType === nextEvent.eventType) {
    pairWeight = 0.3;
  } else if (previousMode === "support" || nextMode === "support") {
    pairWeight = 0.45;
  } else if (previousMode === "demand" && nextMode === "demand") {
    pairWeight = 1.5;
  } else if (
    (previousMode === "demand" && nextMode === "structured") ||
    (previousMode === "structured" && nextMode === "demand")
  ) {
    pairWeight = 1.15;
  } else if (previousMode === "structured" && nextMode === "structured") {
    pairWeight = 0.8;
  }

  if (gapMinutes >= 90) {
    pairWeight *= 0.4;
  } else if (gapMinutes >= 45) {
    pairWeight *= 0.7;
  }

  return pairWeight;
}

function mergeIntervals(events: ClassifiedWeekEvent[]) {
  const sorted = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const merged: MergedInterval[] = [];

  for (const event of sorted) {
    const previous = merged.at(-1);

    if (!previous || event.startTime >= previous.endTime) {
      merged.push({
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        durationMinutes: event.durationMinutes,
      });
      continue;
    }

    if (event.endTime > previous.endTime) {
      previous.endTime = new Date(event.endTime);
      previous.durationMinutes = minutesBetween(previous.startTime, previous.endTime);
    }
  }

  return merged;
}

function clipEventsToDay(date: Date, events: ClassifiedWeekEvent[]) {
  const wake = buildDayBoundary(date, DEFAULT_WAKE_HOUR);
  const sleep = buildDayBoundary(date, DEFAULT_SLEEP_HOUR);

  return events
    .map((event) => ({
      ...event,
      startTime: event.startTime < wake ? wake : event.startTime,
      endTime: event.endTime > sleep ? sleep : event.endTime,
      durationMinutes: minutesBetween(
        event.startTime < wake ? wake : event.startTime,
        event.endTime > sleep ? sleep : event.endTime,
      ),
    }))
    .filter((event) => event.endTime > wake && event.startTime < sleep)
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
}

function buildOpenBlocks(
  date: Date,
  mergedIntervals: MergedInterval[],
  dayEvents: ClassifiedWeekEvent[],
  profile: CognitiveProfileSnapshot,
) {
  const wake = buildDayBoundary(date, DEFAULT_WAKE_HOUR);
  const sleep = buildDayBoundary(date, DEFAULT_SLEEP_HOUR);
  const desiredBlockMinutes = getDesiredBlockMinutes(profile);
  const runwayMinutes = getRunwayMinutes(profile);
  const blocks: OpenBlock[] = [];
  let cursor = wake;

  for (let index = 0; index <= mergedIntervals.length; index += 1) {
    const nextInterval = mergedIntervals[index];
    const end = nextInterval?.startTime ?? sleep;

    if (end > cursor) {
      const durationMinutes = minutesBetween(cursor, end);
      const previousEvents = dayEvents.filter((event) => event.endTime <= cursor);
      const nextEvents = dayEvents.filter((event) => event.startTime >= end);
      const previousStructured = previousEvents.at(-1)
        ? EXTERNALLY_STRUCTURED_TYPES.has(previousEvents.at(-1)!.eventType)
        : false;
      const nextStructured = nextEvents.at(0)
        ? EXTERNALLY_STRUCTURED_TYPES.has(nextEvents.at(0)!.eventType)
        : false;
      const squeezed = previousStructured || nextStructured;
      const requiredMinutes = desiredBlockMinutes + (squeezed ? runwayMinutes : 0);
      const focusCompatible = durationMinutes >= requiredMinutes;
      const emphasizedAsFragmented = durationMinutes >= 20 && !focusCompatible;

      blocks.push({
        startTime: cursor,
        endTime: end,
        durationMinutes,
        squeezed,
        focusCompatible,
        emphasizedAsFragmented,
      });
    }

    cursor = nextInterval?.endTime ?? sleep;
  }

  return blocks;
}

function toSegmentMinutes(date: Date, time: Date) {
  const wake = buildDayBoundary(date, DEFAULT_WAKE_HOUR);
  const minutes = minutesBetween(wake, time);
  const bandMinutes = (DEFAULT_SLEEP_HOUR - DEFAULT_WAKE_HOUR) * 60;

  return Math.max(0, Math.min(bandMinutes, minutes));
}

function buildWeekShapeDay(
  date: Date,
  dayEvents: ClassifiedWeekEvent[],
  openBlocks: OpenBlock[],
) {
  const daySegments: WeekShapeSegment[] = [];
  const eventSegments = dayEvents.map((event) => ({
    kind: "event" as const,
    startMinute: toSegmentMinutes(date, event.startTime),
    endMinute: toSegmentMinutes(date, event.endTime),
    eventType: event.eventType,
  }));
  const openSegments = openBlocks.map((block) => ({
    kind: "open" as const,
    startMinute: toSegmentMinutes(date, block.startTime),
    endMinute: toSegmentMinutes(date, block.endTime),
    emphasis: block.focusCompatible
      ? ("focus" as const)
      : block.emphasizedAsFragmented
        ? ("fragmented" as const)
        : undefined,
  }));

  daySegments.push(...eventSegments, ...openSegments);
  daySegments.sort((left, right) => left.startMinute - right.startMinute);

  return {
    label: format(date, "EEE"),
    date,
    committedMinutes: dayEvents.reduce((sum, event) => sum + event.durationMinutes, 0),
    focusWindowCount: openBlocks.filter((block) => block.focusCompatible).length,
    fragmentedWindowCount: openBlocks.filter((block) => block.emphasizedAsFragmented).length,
    segments: daySegments,
  } satisfies WeekShapeDay;
}

function analyzeDay(
  date: Date,
  events: ClassifiedWeekEvent[],
  profile: CognitiveProfileSnapshot,
) {
  const dayEvents = clipEventsToDay(date, events);
  const mergedIntervals = mergeIntervals(dayEvents);
  const openBlocks = buildOpenBlocks(date, mergedIntervals, dayEvents, profile);
  const eventTypeCounts = countByEventType(dayEvents);
  const committedMinutes = mergedIntervals.reduce((sum, interval) => sum + interval.durationMinutes, 0);
  const categorySwitchCount = dayEvents.reduce((count, event, index, array) => {
    if (index === 0) {
      return count;
    }

    return array[index - 1].eventType === event.eventType ? count : count + 1;
  }, 0);
  const transitionBurden = dayEvents.reduce((sum, event, index, array) => {
    if (index === 0) {
      return sum;
    }

    return sum + getTransitionPairWeight(array[index - 1]!, event);
  }, 0);
  const noon = buildDayBoundary(date, 12);
  const morningUsableMinutes = openBlocks.reduce((sum, block) => {
    if (!block.focusCompatible) {
      return sum;
    }

    return block.endTime <= noon ? sum + block.durationMinutes : sum;
  }, 0);
  const afternoonUsableMinutes = openBlocks.reduce((sum, block) => {
    if (!block.focusCompatible) {
      return sum;
    }

    return block.endTime > noon ? sum + block.durationMinutes : sum;
  }, 0);

  return {
    label: getDayLabel(date),
    date,
    committedMinutes,
    eventCount: dayEvents.length,
    switchCount: Math.max(0, dayEvents.length - 1),
    categorySwitchCount,
    transitionBurden: Number(transitionBurden.toFixed(2)),
    longestGapMinutes: openBlocks.reduce(
      (maxMinutes, block) => Math.max(maxMinutes, block.durationMinutes),
      0,
    ),
    protectedBlockCount: openBlocks.filter((block) => block.focusCompatible).length,
    fragmentedWindowCount: openBlocks.filter((block) => block.emphasizedAsFragmented).length,
    freeBlockCount: openBlocks.length,
    morningUsableMinutes,
    afternoonUsableMinutes,
    structuredEventCount: dayEvents.filter((event) => EXTERNALLY_STRUCTURED_TYPES.has(event.eventType)).length,
    socialCount: dayEvents.filter((event) => event.eventType === "social").length,
    exerciseCount: dayEvents.filter((event) => event.eventType === "exercise").length,
    socialMinutes: dayEvents
      .filter((event) => event.eventType === "social")
      .reduce((sum, event) => sum + event.durationMinutes, 0),
    supportMinutes: dayEvents
      .filter((event) => SUPPORTIVE_EVENT_TYPES.has(event.eventType))
      .reduce((sum, event) => sum + event.durationMinutes, 0),
    explicitRecoveryMinutes: dayEvents
      .filter((event) =>
        event.eventType === "exercise" ||
        event.eventType === "meal" ||
        event.eventType === "personal_care",
      )
      .reduce((sum, event) => sum + event.durationMinutes, 0),
    events: dayEvents,
    openBlocks,
    eventTypeCounts,
    weekShapeDay: buildWeekShapeDay(date, dayEvents, openBlocks),
  } satisfies DayAnalysis;
}

function serializeClassifiedEvents(events: ClassifiedWeekEvent[]) {
  return events.map((event) => ({
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
  })) satisfies PersistedClassifiedWeekEvent[];
}

function serializeMetrics(metrics: WeekAnalysisMetrics) {
  return {
    ...metrics,
    dailyLoadScores: metrics.dailyLoadScores.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    })),
    dailyLoadDebug: metrics.dailyLoadDebug.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    })),
    weekShapeDays: metrics.weekShapeDays.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    })),
  } as PersistedWeekAnalysisMetrics;
}

function parseClassifiedEvents(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const event = entry as PersistedClassifiedWeekEvent;

    return [{
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    }] satisfies ClassifiedWeekEvent[];
  });
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function normalizeWeekAnalysisMetrics(
  value: Partial<PersistedWeekAnalysisMetrics> | null | undefined,
): WeekAnalysisMetrics {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_WEEK_ANALYSIS_METRICS;
  }

  return {
    totalCommittedMinutes: finiteNumber(value.totalCommittedMinutes),
    totalOpenMinutes: finiteNumber(value.totalOpenMinutes),
    overallLoadScore: normalizeDisplayLoadScore(value.overallLoadScore),
    scheduledLoadScore: normalizeDisplayLoadScore(value.scheduledLoadScore),
    latentDemandMinutes: finiteNumber(value.latentDemandMinutes),
    availableMarginMinutes: finiteNumber(value.availableMarginMinutes),
    committedHoursByDay: Array.isArray(value.committedHoursByDay)
      ? value.committedHoursByDay.map((day) => ({
          label: typeof day?.label === "string" ? day.label : "",
          committedHours: finiteNumber(day?.committedHours),
        }))
      : [],
    dailyLoadScores: Array.isArray(value.dailyLoadScores)
      ? value.dailyLoadScores.map((day) => ({
          label: typeof day?.label === "string" ? day.label : "",
          date: day?.date ? new Date(day.date) : new Date(0),
          score: normalizeDisplayLoadScore(day?.score),
          committedHours: finiteNumber(day?.committedHours),
          operatingMode:
            day?.operatingMode === "absorb" ||
            day?.operatingMode === "protect" ||
            day?.operatingMode === "build" ||
            day?.operatingMode === "recover"
              ? day.operatingMode
              : "protect",
          modeTitle: typeof day?.modeTitle === "string" ? day.modeTitle : "Protect Day",
          modeMeaning: typeof day?.modeMeaning === "string" ? day.modeMeaning : "",
          modeActions: Array.isArray(day?.modeActions)
            ? day.modeActions.filter((item): item is string => typeof item === "string")
            : [],
          modeReframe: typeof day?.modeReframe === "string" ? day.modeReframe : "",
        }))
      : [],
    dailyLoadDebug: Array.isArray(value.dailyLoadDebug)
      ? value.dailyLoadDebug.map((day) => ({
          label: typeof day?.label === "string" ? day.label : "",
          date: day?.date ? new Date(day.date) : new Date(0),
          demandSubtotal: finiteNumber(day?.demandSubtotal),
          evaluativeLoadSubtotal: finiteNumber(day?.evaluativeLoadSubtotal),
          latentDemandSubtotal: finiteNumber(day?.latentDemandSubtotal),
          anticipatoryExamPressure: finiteNumber(day?.anticipatoryExamPressure),
          supportSubtotal: finiteNumber(day?.supportSubtotal),
          transitionPenalty: finiteNumber(day?.transitionPenalty),
          fragmentationPenalty: finiteNumber(day?.fragmentationPenalty),
          compressionPenalty: finiteNumber(day?.compressionPenalty),
          openTimeSupport: finiteNumber(day?.openTimeSupport),
          accumulationCarryover: finiteNumber(day?.accumulationCarryover),
          rawScoreBeforeScaling: finiteNumber(day?.rawScoreBeforeScaling),
          finalDisplayScore: normalizeDisplayLoadScore(day?.finalDisplayScore),
        }))
      : [],
    weeklyLoadDebug:
      value.weeklyLoadDebug && typeof value.weeklyLoadDebug === "object" && !Array.isArray(value.weeklyLoadDebug)
        ? {
            scheduledWeeklyRawScoreBeforeLatent: finiteNumber(
              value.weeklyLoadDebug.scheduledWeeklyRawScoreBeforeLatent,
            ),
            evaluativeLoadContribution: finiteNumber(value.weeklyLoadDebug.evaluativeLoadContribution),
            anticipatoryExamContribution: finiteNumber(
              value.weeklyLoadDebug.anticipatoryExamContribution,
            ),
            latentDemandContribution: finiteNumber(value.weeklyLoadDebug.latentDemandContribution),
            summedDailyRawScore: finiteNumber(value.weeklyLoadDebug.summedDailyRawScore),
            averageDailyRawScore: finiteNumber(value.weeklyLoadDebug.averageDailyRawScore),
            multiDayPatternPenalties: finiteNumber(value.weeklyLoadDebug.multiDayPatternPenalties),
            weeklyAggregationPenalty: finiteNumber(value.weeklyLoadDebug.weeklyAggregationPenalty),
            recoveryCredits: finiteNumber(value.weeklyLoadDebug.recoveryCredits),
            weeklyStabilizingCredits: finiteNumber(value.weeklyLoadDebug.weeklyStabilizingCredits),
            supportFactor: finiteNumber(value.weeklyLoadDebug.supportFactor) || 1,
            weeklyRawScoreBeforeScaling: finiteNumber(value.weeklyLoadDebug.weeklyRawScoreBeforeScaling),
            finalWeeklyDisplayScore: normalizeDisplayLoadScore(
              value.weeklyLoadDebug.finalWeeklyDisplayScore,
            ),
          }
        : EMPTY_WEEK_ANALYSIS_METRICS.weeklyLoadDebug,
    freeBlocksByDay: Array.isArray(value.freeBlocksByDay)
      ? value.freeBlocksByDay.map((day) => ({
          label: typeof day?.label === "string" ? day.label : "",
          count: finiteNumber(day?.count),
        }))
      : [],
    medianFreeBlockMinutes: finiteNumber(value.medianFreeBlockMinutes),
    freeBlockCount30: finiteNumber(value.freeBlockCount30),
    freeBlockCount60: finiteNumber(value.freeBlockCount60),
    freeBlockCount90: finiteNumber(value.freeBlockCount90),
    fragmentationBurden: finiteNumber(value.fragmentationBurden),
    protectedBlockAvailability: finiteNumber(value.protectedBlockAvailability),
    loadConcentration: finiteNumber(value.loadConcentration),
    morningUsableMinutes: finiteNumber(value.morningUsableMinutes),
    afternoonUsableMinutes: finiteNumber(value.afternoonUsableMinutes),
    transitionDensity: finiteNumber(value.transitionDensity),
    eventTypeCounts:
      value.eventTypeCounts && typeof value.eventTypeCounts === "object" && !Array.isArray(value.eventTypeCounts)
        ? value.eventTypeCounts
        : {},
    externallyStructuredCount: finiteNumber(value.externallyStructuredCount),
    socialCount: finiteNumber(value.socialCount),
    exerciseCount: finiteNumber(value.exerciseCount),
    workClassMinutes: finiteNumber(value.workClassMinutes),
    meetingsStructuredMinutes: finiteNumber(value.meetingsStructuredMinutes),
    socialMinutes: finiteNumber(value.socialMinutes),
    recoverySoloMinutes: finiteNumber(value.recoverySoloMinutes),
    squeezedOpenBlockCount: finiteNumber(value.squeezedOpenBlockCount),
    bufferedOpenBlockCount: finiteNumber(value.bufferedOpenBlockCount),
    weekShapeDays: Array.isArray(value.weekShapeDays)
      ? value.weekShapeDays.map((day) => ({
          label: typeof day?.label === "string" ? day.label : "",
          date: day?.date ? new Date(day.date) : new Date(0),
          committedMinutes: finiteNumber(day?.committedMinutes),
          focusWindowCount: finiteNumber(day?.focusWindowCount),
          fragmentedWindowCount: finiteNumber(day?.fragmentedWindowCount),
          segments: Array.isArray(day?.segments)
            ? day.segments
                .filter((segment) => segment && typeof segment === "object")
                .map((segment) => ({
                  kind: segment.kind === "event" ? "event" : "open",
                  startMinute: finiteNumber(segment.startMinute),
                  endMinute: finiteNumber(segment.endMinute),
                  eventType: segment.eventType,
                  emphasis: segment.emphasis,
                }))
            : [],
        }))
      : [],
  };
}

function parseMetrics(value: Prisma.JsonValue | null | undefined): WeekAnalysisMetrics {
  return normalizeWeekAnalysisMetrics(value as Partial<PersistedWeekAnalysisMetrics> | null | undefined);
}

function buildDerivedMetrics(
  dayAnalyses: DayAnalysis[],
  classifiedEvents: ClassifiedWeekEvent[],
  profile: CognitiveProfileSnapshot,
) {
  const gapLengths = dayAnalyses.flatMap((day) =>
    day.openBlocks.map((block) => block.durationMinutes).filter((minutes) => minutes > 0),
  );
  const sortedGapLengths = [...gapLengths].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedGapLengths.length / 2);
  const medianFreeBlockMinutes = sortedGapLengths.length === 0
    ? 0
    : sortedGapLengths.length % 2 === 0
      ? Math.round((sortedGapLengths[middleIndex - 1] + sortedGapLengths[middleIndex]) / 2)
      : sortedGapLengths[middleIndex];
  const totalCommittedMinutes = dayAnalyses.reduce((sum, day) => sum + day.committedMinutes, 0);
  const cappedCommittedMinutes = Math.min(168 * 60, totalCommittedMinutes);
  const busiestDayMinutes = Math.max(0, ...dayAnalyses.map((day) => day.committedMinutes));
  const totalSwitches = dayAnalyses.reduce((sum, day) => sum + day.transitionBurden, 0);
  const fragmentedWindowCount = dayAnalyses.reduce((sum, day) => sum + day.fragmentedWindowCount, 0);
  const squeezedOpenBlockCount = dayAnalyses.reduce(
    (sum, day) => sum + day.openBlocks.filter((block) => block.squeezed).length,
    0,
  );
  const bufferedOpenBlockCount = dayAnalyses.reduce(
    (sum, day) => sum + day.openBlocks.filter((block) => block.focusCompatible).length,
    0,
  );
  const totalOpenMinutes = dayAnalyses.reduce(
    (sum, day) => sum + day.openBlocks.reduce((daySum, block) => daySum + block.durationMinutes, 0),
    0,
  );
  const workClassMinutes = classifiedEvents
    .filter((event) =>
      event.eventType === "evaluative" ||
      event.eventType === "class" ||
      event.eventType === "study_work" ||
      event.eventType === "deep_work" ||
      event.eventType === "admin"
    )
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const meetingsStructuredMinutes = classifiedEvents
    .filter((event) =>
      event.eventType === "work_meeting" ||
      event.eventType === "appointment" ||
      event.eventType === "commute" ||
      event.eventType === "travel",
    )
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const socialMinutes = classifiedEvents
    .filter((event) => event.eventType === "social")
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const recoverySoloMinutes = classifiedEvents
    .filter((event) =>
      event.eventType === "exercise" ||
      event.eventType === "meal" ||
      event.eventType === "personal_care" ||
      event.eventType === "errand",
    )
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const supportDays = dayAnalyses.filter((day) => day.supportMinutes >= 60 || day.explicitRecoveryMinutes >= 45).length;
  const supportTypeCount = [
    socialMinutes > 0,
    classifiedEvents.some((event) => event.eventType === "exercise"),
    classifiedEvents.some((event) => event.eventType === "meal"),
    classifiedEvents.some((event) => event.eventType === "personal_care"),
  ].filter(Boolean).length;
  const meaningfulRecoveryDays = dayAnalyses.filter((day) => {
    const openSupportSummary = getOpenSupportSummary(day);

    return (
      day.explicitRecoveryMinutes >= 45 ||
      day.supportMinutes >= 90 ||
      openSupportSummary.strongSupportBlocks > 0
    );
  }).length;
  const activeDayCount = dayAnalyses.filter((day) => day.eventCount > 0).length;
  const weeklyClassHours =
    classifiedEvents
      .filter((event) => event.eventType === "class")
      .reduce((sum, event) => sum + event.durationMinutes, 0) / 60;
  const weeklyStudyWorkHours =
    classifiedEvents
      .filter((event) => event.eventType === "study_work")
      .reduce((sum, event) => sum + event.durationMinutes, 0) / 60;
  const weeklyClassCount = classifiedEvents.filter((event) => event.eventType === "class").length;
  const evaluativeEvents = classifiedEvents.filter((event) => event.eventType === "evaluative");
  const weeklyEvaluativeHours = evaluativeEvents.reduce((sum, event) => sum + event.durationMinutes, 0) / 60;
  const evaluativeEventDays = evaluativeEvents.map((event) => ({
    dayStart: startOfLocalDay(event.startTime),
    hours: event.durationMinutes / 60,
  }));
  const academicPressureAnchor = clamp(
    weeklyClassHours * 0.3 +
      weeklyStudyWorkHours * 0.15 +
      weeklyClassCount * 0.22 +
      weeklyEvaluativeHours * 0.18 +
      (profile.overcommitmentRisk >= 4 ? 0.4 : 0) +
      (profile.ambiguityTolerance <= 2 ? 0.25 : 0) +
      (profile.routinePreference >= 4 ? 0.15 : 0),
    0,
    4.2,
  );
  const academicAnchorHoursByDay = dayAnalyses.map((day) =>
    getEventHours(
      day,
      (eventType) =>
        eventType === "class" ||
        eventType === "study_work" ||
        eventType === "work_meeting" ||
        eventType === "appointment",
    ),
  );
  let carryover = 0;
  const dailyLoadDebug: DailyLoadDebug[] = [];
  let totalLatentDemandHours = 0;
  let totalAvailableMarginMinutes = 0;
  let totalEvaluativeLoad = 0;
  let totalAnticipatoryExamPressure = 0;
  const scheduledRawSignals: number[] = [];
  const dailyRawSignals = dayAnalyses.map((day, index) => {
    const carryoverIn = carryover;
    const openSupportSummary = getOpenSupportSummary(day);
    const compressionCount = getCompressionCount(day);
    const primaryDemandHours = getEventHours(
      day,
      (eventType) => eventType === "class" || eventType === "deep_work",
    );
    const evaluativeHours = getEventHours(day, isEvaluativeType);
    const selfDirectedWorkHours = getEventHours(day, isSelfDirectedWorkType);
    const structuredDemandHours = getEventHours(day, isStructuredObligationType);
    const classHours = getEventHours(day, (eventType) => eventType === "class");
    const socialHours = day.socialMinutes / 60;
    const supportiveSocialShare =
      profile.socialRecoveryValue >= 4
        ? 0.9
        : profile.socialRecoveryValue <= 2
          ? compressionCount >= 2 || day.structuredEventCount >= 4
            ? 0.15
            : 0.35
          : compressionCount >= 2 || day.structuredEventCount >= 4
            ? 0.4
            : 0.7;
    const lowDemandSocialHours = socialHours * supportiveSocialShare;
    const highDemandSocialHours = socialHours * (1 - supportiveSocialShare);
    const exerciseHours = getEventHours(day, (eventType) => eventType === "exercise");
    const careHours = getEventHours(day, (eventType) =>
      eventType === "meal" || eventType === "personal_care" || eventType === "errand",
    );
    const evaluativeLoad = evaluativeHours * 1.45 + (evaluativeHours > 0 ? 1.35 : 0);
    const demand =
      primaryDemandHours * 1.0 +
      selfDirectedWorkHours * 0.62 +
      structuredDemandHours * 0.72 +
      highDemandSocialHours * 0.35 +
      evaluativeLoad;
    const support =
      exerciseHours * 0.88 +
      careHours * 0.35 +
      openSupportSummary.explicitRecovery * 1.05 +
      lowDemandSocialHours * 0.35 +
      openSupportSummary.ambientSupport +
      openSupportSummary.bufferedSupport +
      openSupportSummary.squeezeRelief;
    const transitionPenalty = Math.min(4.9, day.transitionBurden) * (0.64 + profile.transitionCost * 0.1);
    const fragmentationPenalty =
      day.fragmentedWindowCount * (0.72 + profile.fragmentationCost * 0.12) +
      (
        day.longestGapMinutes < getDesiredBlockMinutes(profile)
          ? 1.45 +
            Math.min(
              2.9,
              (getDesiredBlockMinutes(profile) - Math.max(0, day.longestGapMinutes)) / 30,
            )
          : 0
      );
    const compressionPenalty = compressionCount * (0.78 + profile.transitionCost * 0.09);
    const friction = transitionPenalty + fragmentationPenalty + compressionPenalty;
    const stabilizingCredit =
      (openSupportSummary.strongSupportBlocks > 0 ? 1.75 : 0) +
      (day.exerciseCount > 0 ? (profile.exerciseRecoveryValue >= 4 ? 2.1 : 1.2) : 0) +
      (lowDemandSocialHours >= 1 ? 1.0 : 0) +
      (day.supportMinutes >= 120 ? 1.0 : 0) +
      (careHours >= 1 ? 0.35 : 0);
    const scheduledRawSignal = Math.max(
      0,
      demand - support + friction + carryover - stabilizingCredit,
    );
    const scheduledDemandHoursEquivalent =
      primaryDemandHours +
      selfDirectedWorkHours * 0.75 +
      structuredDemandHours * 0.55 +
      highDemandSocialHours * 0.25 +
      evaluativeHours * 0.95;
    const dayLightness = clamp((4.5 - scheduledDemandHoursEquivalent) / 4.5, 0, 1);
    const nearbyAnchorHours =
      (academicAnchorHoursByDay[index - 1] ?? 0) * 0.55 +
      (academicAnchorHoursByDay[index + 1] ?? 0) * 0.7;
    const spilloverPressure = clamp(nearbyAnchorHours / 4.5, 0, 1.1);
    const profileBias =
      (profile.overcommitmentRisk >= 4 ? 0.14 : 0) +
      (profile.ambiguityTolerance <= 2 ? 0.1 : 0) +
      (profile.routinePreference >= 4 ? 0.06 : 0);
    const recoveryGuard =
      (day.explicitRecoveryMinutes >= 90 ? 0.5 : 0) +
      (day.supportMinutes >= 120 ? 0.35 : 0) +
      (openSupportSummary.strongSupportBlocks > 0 ? 0.25 : 0);
    const alreadyPlacedWorkRelief = Math.min(0.9, selfDirectedWorkHours * 0.35);
    const latentSelfDirectedHours = clamp(
      academicPressureAnchor *
        dayLightness *
        (
          spilloverPressure * 0.2 +
          (classHours > 0 ? 0.3 : 0.03) +
          (day.structuredEventCount > 0 ? 0.06 : 0) +
          profileBias * 0.28
        ) +
        classHours * 0.62 * dayLightness -
        alreadyPlacedWorkRelief -
        recoveryGuard,
      0,
      1.55,
    );
    const latentDemand = Math.min(1.8, latentSelfDirectedHours);
    const anticipatoryExamPressure = clamp(
      evaluativeEventDays.reduce((sum, evaluativeDay) => {
        const dayOffset = Math.round(
          (evaluativeDay.dayStart.getTime() - startOfLocalDay(day.date).getTime()) / (24 * 60 * 60 * 1000),
        );

        if (dayOffset < 1 || dayOffset > 3) {
          return sum;
        }

        const proximityWeight = dayOffset === 1 ? 1 : dayOffset === 2 ? 0.62 : 0.34;
        return sum + proximityWeight * (0.65 + evaluativeDay.hours * 0.5);
      }, 0) -
        recoveryGuard * 0.4 -
        Math.min(0.3, openSupportSummary.bufferedSupport * 0.22),
      0,
      2.4,
    );
    const rawSignal = Math.max(0, scheduledRawSignal + latentDemand + anticipatoryExamPressure);

    scheduledRawSignals.push(scheduledRawSignal);
    totalLatentDemandHours += latentSelfDirectedHours;
    totalAvailableMarginMinutes += openSupportSummary.availableMarginMinutes;
    totalEvaluativeLoad += evaluativeLoad;
    totalAnticipatoryExamPressure += anticipatoryExamPressure;

    carryover = Math.max(
      0,
      rawSignal * 0.16 -
        support * 0.28 -
        openSupportSummary.explicitRecovery * 0.34 -
        (day.exerciseCount > 0 ? 1.1 : 0) -
        (openSupportSummary.strongSupportBlocks > 0 ? 0.45 : 0),
    );

    dailyLoadDebug.push({
      label: day.label,
      date: day.date,
      demandSubtotal: Number(demand.toFixed(2)),
      evaluativeLoadSubtotal: Number(evaluativeLoad.toFixed(2)),
      latentDemandSubtotal: Number(latentDemand.toFixed(2)),
      anticipatoryExamPressure: Number(anticipatoryExamPressure.toFixed(2)),
      supportSubtotal: Number((support + stabilizingCredit).toFixed(2)),
      transitionPenalty: Number(transitionPenalty.toFixed(2)),
      fragmentationPenalty: Number(fragmentationPenalty.toFixed(2)),
      compressionPenalty: Number(compressionPenalty.toFixed(2)),
      openTimeSupport: Number(
        (openSupportSummary.explicitRecovery + openSupportSummary.bufferedSupport + openSupportSummary.squeezeRelief).toFixed(2),
      ),
      accumulationCarryover: Number(carryoverIn.toFixed(2)),
      rawScoreBeforeScaling: Number(rawSignal.toFixed(2)),
      finalDisplayScore: toDisplayLoadScore(rawSignal),
    });

    return rawSignal;
  });
  const dailyLoadScores = dayAnalyses.map((day, index) => {
    const committedHours = day.committedMinutes / 60;
    const carryoverIn = dailyLoadDebug[index]?.accumulationCarryover ?? 0;
    const availableMarginMinutes = Math.round(getOpenSupportSummary(day).availableMarginMinutes);
    const operatingMode = getDailyOperatingMode(
      day,
      toDisplayLoadScore(dailyRawSignals[index] ?? 0),
      carryoverIn,
      availableMarginMinutes,
      profile,
    );
    const modeCopy = getDailyOperatingModeCopy(operatingMode, profile);

    return {
      label: day.label,
      date: day.date,
      score: toDisplayLoadScore(dailyRawSignals[index] ?? 0),
      committedHours: Number(committedHours.toFixed(1)),
      operatingMode,
      modeTitle: modeCopy.title,
      modeMeaning: modeCopy.meaning,
      modeActions: modeCopy.actions,
      modeReframe: modeCopy.reframe,
    } satisfies DailyLoadScore;
  });
  const scheduledDailyDisplayScores = scheduledRawSignals.map((signal) => toDisplayLoadScore(signal));
  const consecutiveHighDemandDays = getConsecutiveHighDemandDays(dailyRawSignals);
  const highStrainDays = dailyRawSignals.filter((signal) => signal >= 24).length;
  const socialDensity = cappedCommittedMinutes === 0 ? 0 : socialMinutes / cappedCommittedMinutes;
  const effectiveLoadDayCount = Math.max(4, Math.min(dayAnalyses.length, Math.max(activeDayCount, highStrainDays)));
  const averageScheduledRaw =
    effectiveLoadDayCount === 0
      ? 0
      : scheduledRawSignals.reduce((sum, signal) => sum + signal, 0) / effectiveLoadDayCount;
  const averageDailyRaw =
    effectiveLoadDayCount === 0
      ? 0
      : dailyRawSignals.reduce((sum, signal) => sum + signal, 0) / effectiveLoadDayCount;
  const topScheduledAverage = getTopSignalAverage(scheduledRawSignals, Math.min(2, scheduledRawSignals.length));
  const topDailyAverage = getTopSignalAverage(dailyRawSignals, Math.min(2, dailyRawSignals.length));
  const supportFactor =
    clamp(
      1 -
        supportDays * 0.012 -
        meaningfulRecoveryDays * 0.014 -
        supportTypeCount * 0.008 -
        Math.min(
          0.06,
          (recoverySoloMinutes + socialMinutes * 0.55 + totalAvailableMarginMinutes * 0.28) /
            Math.max(1, cappedCommittedMinutes + totalOpenMinutes) *
            0.24,
        ) +
        (supportDays === 0 ? 0.035 : 0) +
        (meaningfulRecoveryDays === 0 ? 0.03 : 0),
      0.92,
      1.03,
    );
  const multiDayPatternPenalties =
    Math.max(0, highStrainDays - 3) * (0.45 + profile.overloadSensitivity * 0.06) +
    Math.max(0, consecutiveHighDemandDays - 2) * (0.7 + profile.overloadSensitivity * 0.08) +
    Math.max(0, squeezedOpenBlockCount - bufferedOpenBlockCount * 0.6) * 0.14 +
    fragmentedWindowCount * (0.08 + profile.fragmentationCost * 0.012) +
    Math.max(0, metricsLikeTransitionDensity(totalSwitches, dayAnalyses.length) - 1.15) *
      (0.72 + profile.transitionCost * 0.08) +
    (recoverySoloMinutes <= 90 ? 0.95 : recoverySoloMinutes <= 180 ? 0.38 : 0) +
    Math.max(0, socialDensity - 0.22) * (profile.socialRecoveryValue >= 4 ? 0.2 : 0.75) +
    Math.max(0, (busiestDayMinutes / Math.max(1, cappedCommittedMinutes)) - 0.46) * 1.4 +
    Math.max(0, activeDayCount - 5) * 0.18;
  const weeklyAggregationPenalty =
    Math.max(0, topDailyAverage - averageDailyRaw - 8) * 0.08 +
    Math.max(0, topDailyAverage - topScheduledAverage - 4) * 0.05;
  const weeklyStabilizingCredits =
    supportDays * 0.28 +
    meaningfulRecoveryDays * 0.35 +
    Math.min(1.5, totalAvailableMarginMinutes / 60 * 0.045) +
    Math.min(0.85, supportTypeCount * 0.16) +
    (socialMinutes >= 120 && profile.socialRecoveryValue >= 4 ? 0.28 : 0) +
    (recoverySoloMinutes >= 180 ? 0.38 : 0);
  const recoveryCredits = weeklyStabilizingCredits;
  const evaluativeLoadContribution = Math.min(4.2, totalEvaluativeLoad * 0.2);
  const anticipatoryExamContribution = Math.min(2.6, totalAnticipatoryExamPressure * 0.28);
  const scheduledWeeklyRawScoreBeforeLatent =
    (averageScheduledRaw * 6.2 +
      topScheduledAverage * 2.0 +
      evaluativeLoadContribution +
      multiDayPatternPenalties +
      weeklyAggregationPenalty -
      weeklyStabilizingCredits) * supportFactor;
  const weeklyRawScoreBeforeScaling =
    (averageDailyRaw * 6.4 +
      topDailyAverage * 2.1 +
      evaluativeLoadContribution +
      anticipatoryExamContribution * 1.15 +
      multiDayPatternPenalties -
      weeklyStabilizingCredits +
      weeklyAggregationPenalty) * supportFactor;
  const scheduledLoadScore = scheduledDailyDisplayScores.length === 0
    ? 0
    : Math.round(
      scheduledDailyDisplayScores.reduce((sum, score) => sum + score, 0) / scheduledDailyDisplayScores.length,
    );
  const overallLoadScore = dailyLoadScores.length === 0
    ? 0
    : Math.round(dailyLoadScores.reduce((sum, day) => sum + day.score, 0) / dailyLoadScores.length);

  return {
    totalCommittedMinutes: cappedCommittedMinutes,
    totalOpenMinutes,
    overallLoadScore,
    scheduledLoadScore,
    latentDemandMinutes: Math.round(totalLatentDemandHours * 60),
    availableMarginMinutes: Math.round(totalAvailableMarginMinutes),
    committedHoursByDay: dayAnalyses.map((day) => ({
      label: day.label,
      committedHours: Number((day.committedMinutes / 60).toFixed(1)),
    })),
    dailyLoadScores,
    dailyLoadDebug,
    weeklyLoadDebug: {
      scheduledWeeklyRawScoreBeforeLatent: Number(scheduledWeeklyRawScoreBeforeLatent.toFixed(2)),
      evaluativeLoadContribution: Number(evaluativeLoadContribution.toFixed(2)),
      anticipatoryExamContribution: Number(anticipatoryExamContribution.toFixed(2)),
      latentDemandContribution: Number(
        (dailyRawSignals.reduce((sum, signal) => sum + signal, 0) -
          scheduledRawSignals.reduce((sum, signal) => sum + signal, 0)).toFixed(2),
      ),
      summedDailyRawScore: Number(dailyRawSignals.reduce((sum, signal) => sum + signal, 0).toFixed(2)),
      averageDailyRawScore: Number(averageDailyRaw.toFixed(2)),
      multiDayPatternPenalties: Number(multiDayPatternPenalties.toFixed(2)),
      weeklyAggregationPenalty: Number(weeklyAggregationPenalty.toFixed(2)),
      recoveryCredits: Number(recoveryCredits.toFixed(2)),
      weeklyStabilizingCredits: Number(weeklyStabilizingCredits.toFixed(2)),
      supportFactor: Number(supportFactor.toFixed(2)),
      weeklyRawScoreBeforeScaling: Number(weeklyRawScoreBeforeScaling.toFixed(2)),
      finalWeeklyDisplayScore: overallLoadScore,
    },
    freeBlocksByDay: dayAnalyses.map((day) => ({
      label: day.label,
      count: day.freeBlockCount,
    })),
    medianFreeBlockMinutes,
    freeBlockCount30: gapLengths.filter((minutes) => minutes >= 30).length,
    freeBlockCount60: gapLengths.filter((minutes) => minutes >= 60).length,
    freeBlockCount90: gapLengths.filter((minutes) => minutes >= 90).length,
    fragmentationBurden: Number(
      (
        fragmentedWindowCount * (0.7 + profile.fragmentationCost * 0.15) +
        squeezedOpenBlockCount * (0.4 + profile.transitionCost * 0.12)
      ).toFixed(1)
    ),
    protectedBlockAvailability: bufferedOpenBlockCount,
    loadConcentration: totalCommittedMinutes === 0
      ? 0
      : Number((busiestDayMinutes / cappedCommittedMinutes).toFixed(2)),
    morningUsableMinutes: dayAnalyses.reduce((sum, day) => sum + day.morningUsableMinutes, 0),
    afternoonUsableMinutes: dayAnalyses.reduce((sum, day) => sum + day.afternoonUsableMinutes, 0),
    transitionDensity: dayAnalyses.length === 0
      ? 0
      : Number((metricsLikeTransitionDensity(totalSwitches, dayAnalyses.length)).toFixed(2)),
    eventTypeCounts: countByEventType(classifiedEvents),
    externallyStructuredCount: classifiedEvents.filter((event) =>
      EXTERNALLY_STRUCTURED_TYPES.has(event.eventType)
    ).length,
    socialCount: classifiedEvents.filter((event) => event.eventType === "social").length,
    exerciseCount: classifiedEvents.filter((event) => event.eventType === "exercise").length,
    workClassMinutes,
    meetingsStructuredMinutes,
    socialMinutes,
    recoverySoloMinutes,
    squeezedOpenBlockCount,
    bufferedOpenBlockCount,
    weekShapeDays: dayAnalyses.map((day) => day.weekShapeDay),
  } satisfies WeekAnalysisMetrics;
}

function createSparseWeekReport(
  classifiedEvents: ClassifiedWeekEvent[],
  profile: CognitiveProfileSnapshot,
  metrics: WeekAnalysisMetrics,
  analyzedAt: Date,
) {
  const desiredBlockMinutes = getDesiredBlockMinutes(profile);
  const eventCount = classifiedEvents.length;

  return {
    analyzedAt,
    expiresAt: addHours(analyzedAt, WEEK_ANALYSIS_CACHE_HOURS),
    observations: eventCount === 0
      ? [
          "The next seven days are lightly scheduled across the included calendars, so this is a lower-confidence read.",
          "Most of the week is still unclaimed, which means your own planning choices will shape it more than fixed commitments.",
          `If you want clean progress, protect one ${desiredBlockMinutes}-minute block before smaller plans start filling the week in.`,
        ]
      : [
          "The next seven days are still fairly open, so the week has more flexibility than constraint.",
          "Most visible commitments are isolated rather than tightly clustered, which keeps the overall read lighter.",
          `You still have room to place ${desiredBlockMinutes}-minute work blocks before the calendar starts feeling crowded.`,
        ],
    suggestions: [
      `Protect one ${desiredBlockMinutes}-minute block early in the week for your most demanding work.`,
      "Use the lighter schedule to decide in advance which open time is for focus and which is for recovery or admin.",
    ],
    classifiedEvents,
    derivedMetrics: metrics,
  } satisfies WeekAnalysisReportSnapshot;
}

function pickBestFocusWindow(dayAnalyses: DayAnalysis[]) {
  const candidates = dayAnalyses.flatMap((day) =>
    day.openBlocks
      .filter((block) => block.focusCompatible)
      .map((block) => ({
        dayLabel: day.label,
        startTime: block.startTime,
        durationMinutes: block.durationMinutes,
        squeezed: block.squeezed,
      })),
  );

  return [...candidates].sort((left, right) => right.durationMinutes - left.durationMinutes)[0] ?? null;
}

export function classifyWeekEvents(events: EphemeralGoogleEvent[]) {
  return events.map((event) => {
    const classification = classifyWeekEventTitle(event.rawTitle);

    return {
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      durationMinutes: event.durationMinutes,
      eventType: classification.eventType,
      confidence: classification.confidence,
      classificationSource: classification.classificationSource,
    } satisfies ClassifiedWeekEvent;
  });
}

export function createWeekAnalysisReport(
  classifiedEvents: ClassifiedWeekEvent[],
  profile: CognitiveProfileSnapshot,
  now = new Date(),
) {
  const analyzedAt = new Date(now);
  const start = startOfLocalDay(now);
  const end = addDays(start, DASHBOARD_DAYS);
  const days = eachDayOfInterval({ start, end: addDays(end, -1) });
  const dayAnalyses = days.map((day) =>
    analyzeDay(day, classifiedEvents.filter((event) => {
      const dayStart = startOfLocalDay(day);
      const dayEnd = addDays(dayStart, 1);

      return event.endTime > dayStart && event.startTime < dayEnd;
    }), profile),
  );
  const metrics = buildDerivedMetrics(dayAnalyses, classifiedEvents, profile);

  if (classifiedEvents.length <= 3) {
    return createSparseWeekReport(classifiedEvents, profile, metrics, analyzedAt);
  }

  const desiredBlockMinutes = getDesiredBlockMinutes(profile);
  const heavyDayMinutes = getHeavyDayMinutes(profile);
  const activeDays = dayAnalyses.filter((day) => day.eventCount > 0);
  const heavyDays = dayAnalyses.filter((day) => day.committedMinutes >= heavyDayMinutes);
  const fragmentedDays = dayAnalyses.filter((day) => day.fragmentedWindowCount >= 2);
  const switchHeavyDays = dayAnalyses.filter((day) => day.categorySwitchCount + day.switchCount >= 4);
  const bestFocusWindow = pickBestFocusWindow(dayAnalyses);
  const busiestDay = [...dayAnalyses].sort((left, right) => right.committedMinutes - left.committedMinutes)[0];
  const scheduledVsExpectedGap = metrics.overallLoadScore - metrics.scheduledLoadScore;

  const observations = [
    scheduledVsExpectedGap >= 8 && metrics.latentDemandMinutes >= 90
      ? "Scheduled load looks lighter than likely lived load here, because some self-directed work still appears to be unplaced."
      : metrics.loadConcentration >= 0.35 && busiestDay.committedMinutes >= 240
      ? `A large share of your committed time lands on ${busiestDay.label}, so the week may feel heavier there than the total hours suggest.`
      : heavyDays.length >= 3
        ? `The week stays fairly loaded across ${heavyDays.length} days, so recovery may matter more than a single peak day.`
        : "The visible load is distributed more evenly across the week, so no single day appears to dominate it.",
    bestFocusWindow
      ? `Your cleanest focus window is ${bestFocusWindow.dayLabel} ${getDayPartLabel(bestFocusWindow.startTime)}, when open time is least interrupted by structured commitments.`
      : `There are no clearly buffered ${desiredBlockMinutes}-minute windows this week, so open time may be less usable than it looks.`,
    fragmentedDays.length >= 2 && profile.fragmentationCost >= 4
      ? `Short gaps show up across ${fragmentedDays.length} days, and your profile is likely to treat that fragmentation as real lost work capacity.`
      : fragmentedDays.length >= 2
        ? `Several days are split into shorter gaps, which are better suited to lighter tasks than to demanding starts.`
        : "Open time is not especially chopped up, so the week keeps more continuity than a crowded calendar usually does.",
    metrics.externallyStructuredCount >= 5
      ? "A lot of the week is anchored by classes, meetings, or appointments, so open blocks between them may be less reliable than they appear."
      : metrics.socialCount >= 2
        ? "A few socially activating plans shape the week, which makes some of the surrounding open time better for lighter work than for open-ended starts."
        : metrics.exerciseCount >= 2
          ? "Exercise shows up meaningfully in the week, which can help create better reset points than the calendar surface alone suggests."
          : "There are fewer externally structured anchors in this week, so the quality of open time matters more than the raw count of events.",
  ].slice(0, 4);

  const suggestions = [
    bestFocusWindow
      ? profile.transitionCost >= 4
        ? `Protect ${bestFocusWindow.dayLabel} ${getDayPartLabel(bestFocusWindow.startTime)} for the work that needs the cleanest runway, not the most adaptation.`
        : `Use ${bestFocusWindow.dayLabel} ${getDayPartLabel(bestFocusWindow.startTime)} for the work that benefits most from the cleanest open stretch.`
      : `Place one ${desiredBlockMinutes}-minute block early in the week before smaller commitments compress the remaining open time.`,
    fragmentedDays.length >= 2 || metrics.squeezedOpenBlockCount >= 3
      ? profile.fragmentationCost >= 4
        ? "Batch admin, email, and short concrete tasks into the broken gaps so your cleaner windows stay intact."
        : "Let shorter gaps absorb lighter work instead of saving everything for one ideal block later."
      : profile.fragmentationCost >= 4
        ? "Keep the cleaner open blocks protected for demanding work before smaller tasks start fragmenting them."
        : "Use the clearer open blocks first, then let lighter work spread into the remainder.",
    switchHeavyDays.length >= 2 || profile.transitionCost >= 4
      ? profile.transitionCost >= 4
        ? "Treat open time right after classes, meetings, or appointments as lower-reliability time and move setup-sensitive work earlier."
        : "Use the more switch-heavy stretches for lighter work, and keep your most open-ended work in the calmer parts of the week."
      : scheduledVsExpectedGap >= 8
        ? "Choose one lightly scheduled day to hold the self-directed work you expect, so it does not quietly spill across the whole week."
        : "Leave visible reset space around the densest stretch so the week stays easier to use than the calendar makes it look.",
  ].slice(0, activeDays.length >= 4 ? 3 : 2);

  return {
    analyzedAt,
    expiresAt: addHours(analyzedAt, WEEK_ANALYSIS_CACHE_HOURS),
    observations,
    suggestions,
    classifiedEvents,
    derivedMetrics: metrics,
  } satisfies WeekAnalysisReportSnapshot;
}

function normalizeReport(report: WeekAnalysisRow) {
  if (!report) {
    return null;
  }

  return {
    analyzedAt: report.analyzedAt,
    expiresAt: report.expiresAt,
    observations: report.observations,
    suggestions: report.suggestions,
    classifiedEvents: parseClassifiedEvents(report.classifiedEvents),
    derivedMetrics: parseMetrics(report.derivedMetrics),
  } satisfies WeekAnalysisReportSnapshot;
}

function normalizeHistoryEntry(entry: WeekAnalysisHistoryRow) {
  return {
    id: entry.id,
    weekStart: entry.weekStart,
    weekEnd: entry.weekEnd,
    analyzedAt: entry.analyzedAt,
    overallLoadScore: entry.overallLoadScore,
    observations: entry.observations,
    suggestions: entry.suggestions,
    derivedMetrics: parseMetrics(entry.derivedMetrics),
  } satisfies WeekAnalysisHistoryEntry;
}

export function buildWeekAnalysisRecordData(
  userId: string,
  report: WeekAnalysisReportSnapshot,
) {
  return {
    userId,
    analyzedAt: report.analyzedAt,
    expiresAt: report.expiresAt,
    observations: report.observations,
    suggestions: report.suggestions,
    classifiedEvents: serializeClassifiedEvents(report.classifiedEvents) as unknown as Prisma.InputJsonValue,
    derivedMetrics: serializeMetrics(report.derivedMetrics) as unknown as Prisma.InputJsonValue,
  };
}

function buildWeekAnalysisHistoryRecordData(
  userId: string,
  report: WeekAnalysisReportSnapshot,
) {
  const { weekStart, weekEnd } = getWeekWindow(report.analyzedAt);

  return {
    userId,
    weekStart,
    weekEnd,
    analyzedAt: report.analyzedAt,
    overallLoadScore: report.derivedMetrics.overallLoadScore,
    observations: report.observations,
    suggestions: report.suggestions,
    derivedMetrics: serializeMetrics(report.derivedMetrics) as unknown as Prisma.InputJsonValue,
  };
}

export async function deleteWeekAnalysisReport(userId: string) {
  await prisma.weekAnalysisReport.deleteMany({
    where: { userId },
  });
}

export async function getWeekAnalysisHistory(userId: string) {
  const { weekStart } = getWeekWindow();
  const history = await prisma.weekAnalysisHistory.findMany({
    where: {
      userId,
      weekStart: {
        lt: weekStart,
      },
    },
    orderBy: {
      weekStart: "desc",
    },
    take: 8,
  });

  return history.map(normalizeHistoryEntry);
}

export async function getWeekAnalysisDashboardState(userId: string): Promise<WeekAnalysisDashboardState> {
  const [profile, googleAccount, report, user] = await Promise.all([
    prisma.workProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.account.findFirst({
      where: { userId, provider: "google" },
    }),
    prisma.weekAnalysisReport.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        includedGoogleCalendarIds: true,
      },
    }),
  ]);
  const savedCalendarIds = user?.includedGoogleCalendarIds ?? [];
  let availableCalendars: GoogleReadableCalendar[] = [];

  if (googleAccount?.access_token) {
    try {
      availableCalendars = await fetchReadableGoogleCalendars(userId);
    } catch {
      availableCalendars = [];
    }
  }

  const selectedCalendarIds = resolveIncludedGoogleCalendarIds(savedCalendarIds, availableCalendars);

  if (!profile) {
    return {
      profile: null,
      normalizedProfile: null,
      googleAccount,
      googleConnected: Boolean(googleAccount?.access_token),
      selectedCalendarIds,
      availableCalendars,
      report: null,
    };
  }

  const normalizedProfile = normalizePlanningProfile(profile);
  const googleConnected = Boolean(googleAccount?.access_token);

  if ((!googleConnected || !normalizedProfile) && report) {
    await deleteWeekAnalysisReport(userId);
  }

  if (report && report.expiresAt <= new Date()) {
    await deleteWeekAnalysisReport(userId);

    return {
      profile,
      normalizedProfile,
      googleAccount,
      googleConnected,
      selectedCalendarIds,
      availableCalendars,
      report: null,
    };
  }

  return {
    profile,
    normalizedProfile,
    googleAccount,
    googleConnected,
    selectedCalendarIds,
    availableCalendars,
    report: googleConnected ? normalizeReport(report) : null,
  };
}

export async function analyzeAndCacheWeek(userId: string) {
  const [profile, user] = await Promise.all([
    prisma.workProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        includedGoogleCalendarIds: true,
      },
    }),
  ]);

  if (!profile) {
    throw new Error("Complete onboarding before analyzing your week.");
  }

  const normalizedProfile = normalizePlanningProfile(profile);

  if (!normalizedProfile) {
    throw new Error("Refresh your profile before analyzing your week.");
  }

  const availableCalendars = await fetchReadableGoogleCalendars(userId);
  const selectedCalendarIds = resolveIncludedGoogleCalendarIds(
    user?.includedGoogleCalendarIds ?? [],
    availableCalendars,
  );
  const events = await fetchEphemeralSelectedCalendarEvents(userId, selectedCalendarIds);
  const classifiedEvents = classifyWeekEvents(events);
  const report = createWeekAnalysisReport(classifiedEvents, normalizedProfile);
  const reportData = buildWeekAnalysisRecordData(userId, report);
  const historyData = buildWeekAnalysisHistoryRecordData(userId, report);

  await prisma.$transaction([
    prisma.weekAnalysisReport.upsert({
      where: { userId },
      update: {
        analyzedAt: reportData.analyzedAt,
        expiresAt: reportData.expiresAt,
        observations: reportData.observations,
        suggestions: reportData.suggestions,
        classifiedEvents: reportData.classifiedEvents,
        derivedMetrics: reportData.derivedMetrics,
      },
      create: reportData,
    }),
    prisma.weekAnalysisHistory.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart: historyData.weekStart,
        },
      },
      update: {
        weekEnd: historyData.weekEnd,
        analyzedAt: historyData.analyzedAt,
        overallLoadScore: historyData.overallLoadScore,
        observations: historyData.observations,
        suggestions: historyData.suggestions,
        derivedMetrics: historyData.derivedMetrics,
      },
      create: historyData,
    }),
  ]);

  return report;
}
