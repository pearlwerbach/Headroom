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
import {
  buildCanonicalClassifiedWeekEvent,
  resolveCompositionCategory,
  type WeekCompositionCategory,
} from "@/lib/week-event-classification";
import { aggregateCategorizedDurations } from "@/lib/week-duration-aggregation";
import { clamp, minutesBetween, startOfLocalDay } from "@/lib/utils";

type WorkProfileRow = NonNullable<Awaited<ReturnType<typeof prisma.workProfile.findFirst>>>;
type WeekAnalysisRow = Awaited<ReturnType<typeof prisma.weekAnalysisReport.findUnique>>;
type WeekAnalysisHistoryRow = Awaited<ReturnType<typeof prisma.weekAnalysisHistory.findMany>>[number];
type GoogleAccountRow = Awaited<ReturnType<typeof prisma.account.findFirst>>;

type PersistedClassifiedWeekEvent = Omit<ClassifiedWeekEvent, "startTime" | "endTime" | "clippedStartTime" | "clippedEndTime"> & {
  startTime: string;
  endTime: string;
  clippedStartTime?: string;
  clippedEndTime?: string;
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
  touchesCommitment: boolean;
  boundedByCommitments: boolean;
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
  "rest",
  "meal",
  "personal_care",
  "errand",
]);
const COMPOSITION_CATEGORIES: WeekCompositionCategory[] = [
  "work_class",
  "meetings_structured",
  "social",
  "recovery_solo",
];
const COMPOSITION_PRIORITY: WeekCompositionCategory[] = [
  "work_class",
  "meetings_structured",
  "social",
  "recovery_solo",
];
const MAX_DISPLAY_LOAD_SCORE = 99;
const LOAD_SCORE_ANCHORS = [
  { raw: 0, display: 0 },
  { raw: 2, display: 15 },
  { raw: 5, display: 34 },
  { raw: 10, display: 52 },
  { raw: 20, display: 67 },
  { raw: 40, display: 82 },
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

function getSymbolicTrajectoryHours(event: ClassifiedWeekEvent) {
  if (
    !event.isAllDayLike ||
    !(event.includeInTrajectory ?? false) ||
    (event.countedDurationHours ?? event.durationMinutes / 60) > 0
  ) {
    return 0;
  }

  switch (event.eventType) {
    case "evaluative":
      return 1.9;
    case "class":
      return 1.25;
    case "study_work":
      return 1.1;
    case "deep_work":
      return 1.15;
    case "admin":
      return 0.75;
    default:
      return 0;
  }
}

function getDaySymbolicTrajectorySummary(date: Date, classifiedEvents: ClassifiedWeekEvent[]) {
  const dayStart = startOfLocalDay(date);
  const dayEnd = addDays(dayStart, 1);

  return classifiedEvents.reduce(
    (summary, event) => {
      if (
        !(event.includeInTrajectory ?? false) ||
        (event.clippedEndTime ?? event.endTime) <= dayStart ||
        (event.clippedStartTime ?? event.startTime) >= dayEnd
      ) {
        return summary;
      }

      const symbolicHours = getSymbolicTrajectoryHours(event);

      if (symbolicHours <= 0) {
        return summary;
      }

      if (event.eventType === "evaluative") {
        summary.evaluativeHours += symbolicHours;
      } else if (event.eventType === "study_work") {
        summary.selfDirectedHours += symbolicHours;
      } else if (event.eventType === "class") {
        summary.classHours += symbolicHours;
        summary.primaryDemandHours += symbolicHours;
      } else if (event.eventType === "deep_work") {
        summary.primaryDemandHours += symbolicHours;
      } else if (event.eventType === "admin") {
        summary.structuredHours += symbolicHours;
      }

      summary.totalSymbolicHours += symbolicHours;
      return summary;
    },
    {
      primaryDemandHours: 0,
      classHours: 0,
      selfDirectedHours: 0,
      structuredHours: 0,
      evaluativeHours: 0,
      totalSymbolicHours: 0,
    },
  );
}

function getOpenSupportSummary(day: DayAnalysis) {
  const usableBlocks = day.openBlocks
    .map((block) => {
      const planningStart = new Date(block.startTime);
      planningStart.setHours(8, 0, 0, 0);
      const planningEnd = new Date(block.startTime);
      planningEnd.setHours(22, 0, 0, 0);
      const boundedStart = block.startTime < planningStart ? planningStart : block.startTime;
      const boundedEnd = block.endTime > planningEnd ? planningEnd : block.endTime;
      const durationMinutes = boundedEnd > boundedStart ? minutesBetween(boundedStart, boundedEnd) : 0;

      if (durationMinutes <= 0) {
        return null;
      }

      return {
        ...block,
        startTime: boundedStart,
        endTime: boundedEnd,
        durationMinutes,
      };
    })
    .filter((block): block is OpenBlock => block !== null);

  const unplannedBufferCandidate = [...usableBlocks]
    .filter((block) => block.touchesCommitment && block.durationMinutes >= 60 && block.durationMinutes <= 150)
    .sort((left, right) => {
      if (left.boundedByCommitments !== right.boundedByCommitments) {
        return Number(right.boundedByCommitments) - Number(left.boundedByCommitments);
      }

      return Math.abs(90 - left.durationMinutes) - Math.abs(90 - right.durationMinutes);
    })[0];

  return usableBlocks.reduce(
    (summary, block) => {
      if (block.focusCompatible) {
        summary.availableMarginMinutes += block.durationMinutes * (block.boundedByCommitments ? 0.24 : 0.18);
      } else if (!block.squeezed && block.durationMinutes >= 45) {
        summary.availableMarginMinutes += block.durationMinutes * 0.06;
      } else {
        summary.availableMarginMinutes += block.durationMinutes * 0.02;
      }

      if (unplannedBufferCandidate && block.startTime.getTime() === unplannedBufferCandidate.startTime.getTime() && block.endTime.getTime() === unplannedBufferCandidate.endTime.getTime()) {
        const countedBufferHours = Math.min(60, block.durationMinutes) / 60;
        summary.bufferedSupport += countedBufferHours * 0.08;
        summary.squeezeRelief += block.squeezed ? countedBufferHours * 0.02 : countedBufferHours * 0.01;
        summary.strongSupportBlocks += block.boundedByCommitments ? 1 : 0;
      }

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
  const largestContiguousBlock = day.longestGapMinutes;
  const transitionCount = day.switchCount + day.categorySwitchCount;
  const highFragmentation =
    day.fragmentedWindowCount >= 2 ||
    (day.fragmentedWindowCount >= 1 && largestContiguousBlock < Math.max(95, desiredBlockMinutes)) ||
    (transitionCount >= 4 && largestContiguousBlock < desiredBlockMinutes + 10);
  const strongRunway =
    largestContiguousBlock >= 120 ||
    day.protectedBlockCount >= 2 ||
    availableMarginMinutes >= 180;
  const usableRunway =
    day.protectedBlockCount >= 1 ||
    largestContiguousBlock >= 90 ||
    availableMarginMinutes >= 110;
  const highRecoveryPresence =
    day.explicitRecoveryMinutes >= 75 ||
    day.supportMinutes >= 120 ||
    (day.exerciseCount > 0 && day.supportMinutes >= 75);
  const moderateRecoveryPresence =
    day.explicitRecoveryMinutes >= 45 ||
    day.supportMinutes >= 90;
  const lowLoad = score <= 40;
  const moderateLoad = score <= 55;
  const highCarryover = carryoverIn >= 1.7 || (carryoverIn >= 1.2 && score <= 44);

  if (
    (highRecoveryPresence && score <= 45) ||
    (moderateRecoveryPresence && lowLoad && transitionCount <= 3) ||
    (highCarryover && moderateRecoveryPresence && availableMarginMinutes >= 90)
  ) {
    return "recover";
  }

  if (
    score >= 60 &&
    highFragmentation &&
    largestContiguousBlock < Math.max(110, desiredBlockMinutes + 10)
  ) {
    return "fragmented";
  }

  if (
    score <= 38 &&
    strongRunway &&
    largestContiguousBlock >= 120 &&
    day.fragmentedWindowCount === 0 &&
    transitionCount <= 2
  ) {
    return "open_capacity";
  }

  if (
    score <= 70 &&
    usableRunway &&
    largestContiguousBlock >= Math.max(90, desiredBlockMinutes) &&
    !highFragmentation
  ) {
    return "protected_work";
  }

  if (highFragmentation && score >= 42) {
    return "fragmented";
  }

  return "follow_through";
}

function getDailyOperatingModeCopy(
  mode: DailyLoadScore["operatingMode"],
  profile: CognitiveProfileSnapshot,
) {
  const protectedWindowLabel = profile.fragmentationCost >= 4 || profile.transitionCost >= 4
    ? "one protected runway"
    : "one real work block";

  switch (mode) {
    case "open_capacity":
      return {
        title: "Open Capacity Day",
        meaning:
          "Use this day to make real progress and prioritize your hardest work.",
        actions: [
          "Place your hardest or most cognitively demanding work in the clearest block.",
          "Keep admin and follow-through outside the best runway.",
          "Use the day early, before later pressure makes the week feel tighter.",
        ],
        reframe: "If you use this kind of day well, the rest of the week usually gets easier to carry.",
      };
    case "follow_through":
      return {
        title: "Follow-Through Day",
        meaning:
          "Move through what is scheduled and do not force depth between transitions.",
        actions: [
          "Let commitments, follow-through, and lighter work be the main job of the day.",
          "Use smaller openings for review, admin, setup, or completion.",
          "Protect momentum without expecting a deep-work day from a scattered schedule.",
        ],
        reframe: "A good Follow-Through Day keeps the week moving without making you fight the structure.",
      };
    case "recover":
      return {
        title: "Recover Day",
        meaning:
          "Let the system reset - recovery today supports the rest of the week.",
        actions: [
          "Let rest, exercise, care, or quieter catch-up take priority.",
          "If work needs to happen, keep it concrete, bounded, and lower-stakes.",
          "Treat open time as margin to protect, not pressure to fill.",
        ],
        reframe: "Protecting capacity on a Recover Day is part of the plan, not a detour from it.",
      };
    case "fragmented":
      return {
        title: "Fragmented Day",
        meaning:
          "Stay modular - deep work will be harder than it looks.",
        actions: [
          "Keep tasks small, modular, and easy to restart between commitments.",
          "Do not spend your best energy trying to force depth into broken openings.",
          "Use the day for review, prep, admin, and bounded follow-through instead.",
        ],
        reframe: "This is not a depth-friendly day, even if the calendar looks more open than it feels.",
      };
    case "protected_work":
    default:
      return {
        title: "Protected Work Day",
        meaning:
          "Protect one real work block - that is the win.",
        actions: [
          `Choose ${protectedWindowLabel} and decide in advance what belongs there.`,
          "Let the rest of the day absorb lighter tasks, follow-through, and transitions.",
          "Keep extra demands from leaking into the one block that can still do real work.",
        ],
        reframe: "The goal is not to do everything today, but to keep one part of the day genuinely usable.",
      };
  }
}

function rebalanceWeeklyOperatingModes(
  modes: DailyLoadScore["operatingMode"][],
  dayAnalyses: DayAnalysis[],
  dailyScores: number[],
  availableMargins: number[],
  profile: CognitiveProfileSnapshot,
) {
  const nextModes = [...modes];
  const followThroughIndexes = nextModes
    .map((mode, index) => ({ mode, index }))
    .filter((entry) => entry.mode === "follow_through")
    .map((entry) => entry.index);

  if (followThroughIndexes.length <= 3) {
    return nextModes;
  }

  const desiredBlockMinutes = getDesiredBlockMinutes(profile);
  const ranked = followThroughIndexes
    .map((index) => {
      const day = dayAnalyses[index]!;
      return {
        index,
        day,
        score: dailyScores[index] ?? 0,
        availableMarginMinutes: availableMargins[index] ?? 0,
      };
    })
    .sort((left, right) => {
      const leftRunway = Math.max(left.day.longestGapMinutes, left.availableMarginMinutes);
      const rightRunway = Math.max(right.day.longestGapMinutes, right.availableMarginMinutes);
      return rightRunway - leftRunway;
    });

  for (const candidate of ranked) {
    const remainingFollowThrough = nextModes.filter((mode) => mode === "follow_through").length;
    if (remainingFollowThrough <= 3) {
      break;
    }

    const { day, score, availableMarginMinutes, index } = candidate;
    const transitionCount = day.switchCount + day.categorySwitchCount;
    const highRecoveryPresence = day.explicitRecoveryMinutes >= 75 || day.supportMinutes >= 120;

    if (
      score <= 40 &&
      (day.longestGapMinutes >= 120 || availableMarginMinutes >= 180) &&
      day.fragmentedWindowCount === 0
    ) {
      nextModes[index] = "open_capacity";
    } else if (
      day.fragmentedWindowCount >= 1 &&
      (day.longestGapMinutes < Math.max(90, desiredBlockMinutes) || transitionCount >= 4)
    ) {
      nextModes[index] = "fragmented";
    } else if (
      day.longestGapMinutes >= Math.max(90, desiredBlockMinutes) ||
      day.protectedBlockCount >= 1
    ) {
      nextModes[index] = "protected_work";
    } else if (highRecoveryPresence && score <= 50) {
      nextModes[index] = "recover";
    }
  }

  return nextModes;
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

function getMergedMinutesForEvents(events: ClassifiedWeekEvent[]) {
  return mergeIntervals(events).reduce((sum, interval) => sum + interval.durationMinutes, 0);
}

function getMergedMinutesForDayAnalyses(
  dayAnalyses: DayAnalysis[],
  matcher: (event: ClassifiedWeekEvent) => boolean,
) {
  return dayAnalyses.reduce(
    (sum, day) => sum + getMergedMinutesForEvents(day.events.filter(matcher)),
    0,
  );
}

function getAnalyzedRange(dayAnalyses: DayAnalysis[]) {
  const start = dayAnalyses[0] ? startOfLocalDay(dayAnalyses[0].date) : new Date(0);
  const end = dayAnalyses[dayAnalyses.length - 1]
    ? addDays(startOfLocalDay(dayAnalyses[dayAnalyses.length - 1]!.date), 1)
    : start;

  return { start, end };
}

function clipEventsToDay(date: Date, events: ClassifiedWeekEvent[]) {
  const wake = buildDayBoundary(date, DEFAULT_WAKE_HOUR);
  const sleep = buildDayBoundary(date, DEFAULT_SLEEP_HOUR);

  return events
    .map((event) => {
      const clippedStart = event.clippedStartTime ?? event.startTime;
      const clippedEnd = event.clippedEndTime ?? event.endTime;
      const startTime = clippedStart < wake ? wake : clippedStart;
      const endTime = clippedEnd > sleep ? sleep : clippedEnd;

      return {
        ...event,
        startTime,
        endTime,
        durationMinutes: minutesBetween(startTime, endTime),
      };
    })
    .filter((event) => event.endTime > wake && event.startTime < sleep && event.durationMinutes > 0)
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
      const touchesCommitment = previousEvents.length > 0 || nextEvents.length > 0;
      const boundedByCommitments = previousEvents.length > 0 && nextEvents.length > 0;
      const squeezed = previousStructured || nextStructured;
      const requiredMinutes = desiredBlockMinutes + (squeezed ? runwayMinutes : 0);
      const focusCompatible = durationMinutes >= requiredMinutes;
      const emphasizedAsFragmented = durationMinutes >= 20 && !focusCompatible;

      blocks.push({
        startTime: cursor,
        endTime: end,
        durationMinutes,
        squeezed,
        touchesCommitment,
        boundedByCommitments,
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
        event.eventType === "rest" ||
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
    clippedStartTime: (event.clippedStartTime ?? event.startTime).toISOString(),
    clippedEndTime: (event.clippedEndTime ?? event.endTime).toISOString(),
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
      title: typeof event.title === "string" ? event.title : "",
      normalizedTitle: typeof event.normalizedTitle === "string" ? event.normalizedTitle : "",
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      clippedStartTime: new Date(event.clippedStartTime ?? event.startTime),
      clippedEndTime: new Date(event.clippedEndTime ?? event.endTime),
      allDay: Boolean(event.allDay),
      isAllDayLike: Boolean(event.isAllDayLike ?? event.allDay),
      durationMinutes: finiteNumber(event.durationMinutes),
      rawDurationHours: finiteNumber(event.rawDurationHours),
      countedDurationHours: finiteNumber(
        event.countedDurationHours ?? (finiteNumber(event.durationMinutes) / 60),
      ),
      eventType: event.eventType,
      compositionCategory: event.compositionCategory ?? null,
      recoveryCategory: event.recoveryCategory ?? null,
      trajectoryLoadCategory: event.trajectoryLoadCategory ?? "neutral",
      matchedRule: typeof event.matchedRule === "string" ? event.matchedRule : undefined,
      sourceCalendar: typeof event.sourceCalendar === "string"
        ? event.sourceCalendar
        : typeof event.sourceCalendarId === "string"
          ? event.sourceCalendarId
          : "unknown",
      sourceCalendarId: typeof event.sourceCalendarId === "string" ? event.sourceCalendarId : undefined,
      includeInComposition: Boolean(event.includeInComposition ?? finiteNumber(event.durationMinutes) > 0),
      includeInRecoveryIslands: Boolean(event.includeInRecoveryIslands ?? false),
      includeInTrajectory: Boolean(event.includeInTrajectory ?? finiteNumber(event.durationMinutes) > 0),
      confidence: event.confidence,
      classificationSource: event.classificationSource,
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
            day?.operatingMode === "open_capacity" ||
            day?.operatingMode === "follow_through" ||
            day?.operatingMode === "protected_work" ||
            day?.operatingMode === "fragmented" ||
            day?.operatingMode === "recover"
              ? day.operatingMode
              : "protected_work",
          modeTitle: typeof day?.modeTitle === "string" ? day.modeTitle : "Protected Work Day",
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
  const analyzedRange = getAnalyzedRange(dayAnalyses);
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
  const compositionAggregation = aggregateCategorizedDurations(
    classifiedEvents
      .filter((event) => (event.includeInComposition ?? true) && (event.compositionCategory ?? resolveCompositionCategory(event.eventType)))
      .map((event) => ({
        title: event.title,
        startTime: event.clippedStartTime ?? event.startTime,
        endTime: event.clippedEndTime ?? event.endTime,
        sourceCalendarId: event.sourceCalendar,
        resolvedCategory: event.compositionCategory ?? resolveCompositionCategory(event.eventType),
      })),
    {
      categories: COMPOSITION_CATEGORIES,
      priority: COMPOSITION_PRIORITY,
      rangeStart: analyzedRange.start,
      rangeEnd: analyzedRange.end,
    },
  );
  const workClassMinutes = Math.round(compositionAggregation.totals.work_class);
  const meetingsStructuredMinutes = Math.round(compositionAggregation.totals.meetings_structured);
  const socialMinutes = Math.round(compositionAggregation.totals.social);
  const recoverySoloMinutes = Math.round(compositionAggregation.totals.recovery_solo);
  const supportDays = dayAnalyses.filter((day) => day.supportMinutes >= 60 || day.explicitRecoveryMinutes >= 45).length;
  const supportTypeCount = [
    socialMinutes > 0,
    classifiedEvents.some((event) => event.recoveryCategory === "exercise"),
    classifiedEvents.some((event) => event.recoveryCategory === "care"),
    classifiedEvents.some((event) => event.recoveryCategory === "rest"),
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
      .reduce(
        (sum, event) => sum + (event.countedDurationHours ?? event.durationMinutes / 60) + getSymbolicTrajectoryHours(event),
        0,
      );
  const weeklyStudyWorkHours =
    classifiedEvents
      .filter((event) => event.eventType === "study_work")
      .reduce(
        (sum, event) => sum + (event.countedDurationHours ?? event.durationMinutes / 60) + getSymbolicTrajectoryHours(event),
        0,
      );
  const weeklyClassCount = classifiedEvents.filter((event) => event.eventType === "class").length;
  const evaluativeEvents = classifiedEvents.filter((event) => event.eventType === "evaluative");
  const weeklyEvaluativeHours = evaluativeEvents.reduce(
    (sum, event) => sum + (event.countedDurationHours ?? event.durationMinutes / 60) + getSymbolicTrajectoryHours(event),
    0,
  );
  const evaluativeEventDays = evaluativeEvents.map((event) => ({
    dayStart: startOfLocalDay(event.clippedStartTime ?? event.startTime),
    hours: event.countedDurationHours ?? event.durationMinutes / 60,
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
    const symbolicTrajectory = getDaySymbolicTrajectorySummary(day.date, classifiedEvents);
    const compressionCount = getCompressionCount(day);
    const primaryDemandHours = getEventHours(
      day,
      (eventType) => eventType === "class" || eventType === "deep_work",
    ) + symbolicTrajectory.primaryDemandHours;
    const evaluativeHours = getEventHours(day, isEvaluativeType) + symbolicTrajectory.evaluativeHours;
    const selfDirectedWorkHours = getEventHours(day, isSelfDirectedWorkType) + symbolicTrajectory.selfDirectedHours;
    const structuredDemandHours = getEventHours(day, isStructuredObligationType) + symbolicTrajectory.structuredHours;
    const classHours = getEventHours(day, (eventType) => eventType === "class") + symbolicTrajectory.classHours;
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
    const weekendDemandPenalty =
      (day.label === "Saturday" || day.label === "Sunday") &&
      (primaryDemandHours + selfDirectedWorkHours + structuredDemandHours + evaluativeHours >= 1.25)
        ? 0.7
        : 0;
    const demand =
      primaryDemandHours * 1.08 +
      selfDirectedWorkHours * 0.78 +
      structuredDemandHours * 0.84 +
      highDemandSocialHours * 0.4 +
      evaluativeLoad +
      weekendDemandPenalty;
    const support =
      exerciseHours * 0.8 +
      careHours * 0.24 +
      openSupportSummary.explicitRecovery * 0.5 +
      lowDemandSocialHours * 0.28 +
      openSupportSummary.ambientSupport * 0.15 +
      openSupportSummary.bufferedSupport +
      openSupportSummary.squeezeRelief;
    const transitionPenalty = Math.min(5.4, day.transitionBurden) * (0.76 + profile.transitionCost * 0.11);
    const fragmentationPenalty =
      day.fragmentedWindowCount * (0.86 + profile.fragmentationCost * 0.12) +
      (
        day.longestGapMinutes < getDesiredBlockMinutes(profile)
          ? 1.7 +
            Math.min(
              3.15,
              (getDesiredBlockMinutes(profile) - Math.max(0, day.longestGapMinutes)) / 30,
            )
          : 0
      );
    const compressionPenalty = compressionCount * (0.92 + profile.transitionCost * 0.1);
    const friction = transitionPenalty + fragmentationPenalty + compressionPenalty;
    const stabilizingCredit =
      (openSupportSummary.strongSupportBlocks > 0 ? 0.12 : 0) +
      (day.exerciseCount > 0 ? (profile.exerciseRecoveryValue >= 4 ? 1.45 : 0.85) : 0) +
      (lowDemandSocialHours >= 1 ? 0.7 : 0) +
      (day.supportMinutes >= 120 ? 0.7 : 0) +
      (careHours >= 1 ? 0.2 : 0);
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
      (openSupportSummary.strongSupportBlocks > 0 ? 0.08 : 0);
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
        Math.min(0.08, openSupportSummary.bufferedSupport * 0.08),
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
        openSupportSummary.explicitRecovery * 0.12 -
        (day.exerciseCount > 0 ? 1.1 : 0) -
        (openSupportSummary.strongSupportBlocks > 0 ? 0.08 : 0),
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
        (openSupportSummary.bufferedSupport + openSupportSummary.squeezeRelief).toFixed(2),
      ),
      accumulationCarryover: Number(carryoverIn.toFixed(2)),
      rawScoreBeforeScaling: Number(rawSignal.toFixed(2)),
      finalDisplayScore: toDisplayLoadScore(rawSignal),
    });

    return rawSignal;
  });
  const displayedDailyScores = dayAnalyses.map((_, index) => toDisplayLoadScore(dailyRawSignals[index] ?? 0));
  const availableMargins = dayAnalyses.map((day) => Math.round(getOpenSupportSummary(day).availableMarginMinutes));
  const initialOperatingModes = dayAnalyses.map((day, index) =>
    getDailyOperatingMode(
      day,
      displayedDailyScores[index] ?? 0,
      dailyLoadDebug[index]?.accumulationCarryover ?? 0,
      availableMargins[index] ?? 0,
      profile,
    ),
  );
  const operatingModes = rebalanceWeeklyOperatingModes(
    initialOperatingModes,
    dayAnalyses,
    displayedDailyScores,
    availableMargins,
    profile,
  );
  const dailyLoadScores = dayAnalyses.map((day, index) => {
    const committedHours = day.committedMinutes / 60;
    const operatingMode = operatingModes[index] ?? "protected_work";
    const modeCopy = getDailyOperatingModeCopy(operatingMode, profile);

    return {
      label: day.label,
      date: day.date,
      score: displayedDailyScores[index] ?? 0,
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
  const rangeStart = startOfLocalDay(new Date());
  const rangeEnd = addDays(rangeStart, DASHBOARD_DAYS);

  return events.flatMap((event) => {
    const classifiedEvent = buildCanonicalClassifiedWeekEvent({
      title: event.rawTitle,
      description: event.rawDescription,
      sourceCalendarId: event.sourceCalendarId,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      rangeStart,
      rangeEnd,
    });

    return classifiedEvent ? [classifiedEvent] : [];
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

      return (
        (event.includeInTrajectory ?? true) &&
        (event.clippedEndTime ?? event.endTime) > dayStart &&
        (event.clippedStartTime ?? event.startTime) < dayEnd &&
        (event.countedDurationHours ?? event.durationMinutes / 60) > 0
      );
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

function shouldLogWeekAnalysisDebug() {
  return process.env.NODE_ENV !== "production" || process.env.PROFILE_MODEL_DEBUG === "true";
}

function logWeekAnalysisDebug(classifiedEvents: ClassifiedWeekEvent[]) {
  if (!shouldLogWeekAnalysisDebug()) {
    return;
  }

  console.info("Week composition debug", {
    events: classifiedEvents.map((event) => ({
      eventTitle: event.title,
      normalizedTitle: event.normalizedTitle,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      clippedStartTime: (event.clippedStartTime ?? event.startTime).toISOString(),
      clippedEndTime: (event.clippedEndTime ?? event.endTime).toISOString(),
      rawDurationHours: event.rawDurationHours ?? event.durationMinutes / 60,
      countedDurationHours: event.countedDurationHours ?? event.durationMinutes / 60,
      isAllDayLike: event.isAllDayLike,
      resolvedCategory: event.compositionCategory,
      sourceCalendar: event.sourceCalendar,
      matchedRule: event.matchedRule ?? "no_match",
      includeInComposition: event.includeInComposition,
    })),
    totalHoursByCategory: Object.fromEntries(
      COMPOSITION_CATEGORIES.map((category) => [
        category,
        Math.round(
          classifiedEvents
          .filter((event) => event.includeInComposition && event.compositionCategory === category)
          .reduce((sum, event) => sum + (event.countedDurationHours ?? event.durationMinutes / 60), 0) * 100,
        ) / 100,
      ]),
    ),
    grandTotalCountedHours:
      Math.round(
        classifiedEvents
          .filter((event) => event.includeInComposition)
          .reduce((sum, event) => sum + (event.countedDurationHours ?? event.durationMinutes / 60), 0) * 100,
      ) / 100,
    totalCategorizedEvents: classifiedEvents.filter((event) => event.includeInComposition).length,
  });
  console.info("Recovery classification debug", {
    events: classifiedEvents.map((event) => ({
      eventTitle: event.title,
      normalizedTitle: event.normalizedTitle,
      detectedRecoveryCategory: event.recoveryCategory,
      confidence: event.confidence ?? "low",
      matchedRule: event.matchedRule ?? "no_match",
      whyExcluded:
        event.includeInRecoveryIslands
          ? null
          : `Resolved to ${event.eventType}, which is not included in Recovery Islands.`,
      sourceCalendar: event.sourceCalendar,
      rawDurationHours: event.rawDurationHours ?? event.durationMinutes / 60,
      countedDurationHours: event.countedDurationHours ?? event.durationMinutes / 60,
      isAllDayLike: event.isAllDayLike,
      includeInRecoveryIslands: event.includeInRecoveryIslands,
    })),
  });
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
  const analyzedAt = new Date();
  const rangeStart = startOfLocalDay(analyzedAt);
  const rangeEnd = addDays(rangeStart, DASHBOARD_DAYS);
  const classifiedEvents = events.flatMap((event) => {
    const classifiedEvent = buildCanonicalClassifiedWeekEvent({
      title: event.rawTitle,
      description: event.rawDescription,
      sourceCalendarId: event.sourceCalendarId,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      rangeStart,
      rangeEnd,
    });

    return classifiedEvent ? [classifiedEvent] : [];
  });
  logWeekAnalysisDebug(classifiedEvents);
  const report = createWeekAnalysisReport(classifiedEvents, normalizedProfile, analyzedAt);
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
