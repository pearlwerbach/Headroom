import { addDays, differenceInHours, eachDayOfInterval, isSameDay, set } from "date-fns";
import { DASHBOARD_DAYS, DEFAULT_SLEEP_HOUR, DEFAULT_WAKE_HOUR } from "@/lib/constants";
import {
  getDashboardEventInterpretation,
  isSocialEvent,
} from "@/lib/calendar";
import type {
  CalendarEventSnapshot,
  CognitiveProfileSnapshot,
  RecommendationDraft,
  TaskSnapshot,
  TimeWindow,
  WeeklyLoadMetrics,
} from "@/lib/domain";
import { clamp, minutesBetween, startOfLocalDay } from "@/lib/utils";

interface InterpretedPlanningEvent {
  event: CalendarEventSnapshot;
  effectiveType: ReturnType<typeof getDashboardEventInterpretation>["type"];
  effectiveTypeSource: ReturnType<typeof getDashboardEventInterpretation>["source"];
  recoveryMode: ReturnType<typeof getDashboardEventInterpretation>["recoveryMode"];
}

function buildDayBoundary(date: Date, hour: number) {
  return set(date, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
}

function mergeIntervals<T extends { startTime: Date; endTime: Date }>(events: T[]) {
  const sorted = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const merged: T[] = [];

  for (const event of sorted) {
    const previous = merged.at(-1);

    if (!previous || event.startTime >= previous.endTime) {
      merged.push({ ...event });
      continue;
    }

    if (event.endTime > previous.endTime) {
      previous.endTime = event.endTime;
    }
  }

  return merged;
}

function interpretPlanningEvents(
  events: CalendarEventSnapshot[],
  profile: CognitiveProfileSnapshot,
) {
  return events.map((event) => {
    const interpretation = getDashboardEventInterpretation(event, profile);

    return {
      event,
      effectiveType: interpretation.type,
      effectiveTypeSource: interpretation.source,
      recoveryMode: interpretation.recoveryMode,
    } satisfies InterpretedPlanningEvent;
  });
}

function getTopRecoveryMode(profile: CognitiveProfileSnapshot) {
  return profile.preferredRecoveryModes[0] ?? "quiet";
}

function getSwitchHeavyThreshold(profile: CognitiveProfileSnapshot) {
  return profile.transitionCost >= 4 ? 3 : 5;
}

function getRecoveryValueForMode(
  profile: CognitiveProfileSnapshot,
  mode: "exercise" | "social" | "quiet",
) {
  if (mode === "exercise") {
    return profile.exerciseRecoveryValue;
  }

  if (mode === "social") {
    return profile.socialRecoveryValue;
  }

  return profile.quietRecoveryValue;
}

function getRecoveryModeLabel(mode: "exercise" | "social" | "quiet") {
  return (
    {
      exercise: "movement-based reset",
      social: "social reset",
      quiet: "quiet reset",
    }[mode]
  );
}

function createWindowsForDay(
  date: Date,
  events: InterpretedPlanningEvent[],
  profile: CognitiveProfileSnapshot,
): TimeWindow[] {
  const wake = buildDayBoundary(date, DEFAULT_WAKE_HOUR);
  const sleep = buildDayBoundary(date, DEFAULT_SLEEP_HOUR);
  const clampedEvents = mergeIntervals(
    events
      .map(({ event, effectiveType, recoveryMode, effectiveTypeSource }) => ({
        ...event,
        effectiveType,
        recoveryMode,
        effectiveTypeSource,
        startTime: event.startTime < wake ? wake : event.startTime,
        endTime: event.endTime > sleep ? sleep : event.endTime,
      }))
      .filter((event) => event.endTime > wake && event.startTime < sleep),
  );

  const demandBlocks = events.filter((event) => event.effectiveType === "demand").length;
  const contextSwitchCount = events.length;
  const windows: TimeWindow[] = [];
  let cursor = wake;

  for (const [index, event] of clampedEvents.entries()) {
    if (event.startTime > cursor) {
      const durationMinutes = minutesBetween(cursor, event.startTime);
      const baseQuality =
        durationMinutes >= (profile.deepWorkCapacity <= 2 ? 60 : 90)
          ? "deep"
          : durationMinutes >= 45
            ? "medium"
            : durationMinutes >= 15
              ? "light"
              : null;

      if (baseQuality) {
        const previousEvent = clampedEvents[index - 1];
        const nextEvent = event;
        const adjacentDemandBefore = previousEvent
          ? previousEvent.effectiveType === "demand"
          : false;
        const adjacentDemandAfter = nextEvent.effectiveType === "demand";
        let quality: "deep" | "medium" | "light" = baseQuality;

        if (
          quality === "deep" &&
          ((demandBlocks >= 3 && profile.overloadSensitivity >= 4) ||
            contextSwitchCount >= getSwitchHeavyThreshold(profile)) &&
          durationMinutes < 120
        ) {
          quality = "medium";
        }

        if (
          quality === "deep" &&
          (adjacentDemandBefore || adjacentDemandAfter) &&
          durationMinutes < 150
        ) {
          quality = "medium";
        }

        windows.push({
          id: `${date.toISOString()}-${windows.length}`,
          date,
          start: cursor,
          end: event.startTime,
          durationMinutes,
          quality,
          demandBlocks,
          contextSwitchCount,
          adjacentDemandBefore,
          adjacentDemandAfter,
          followsWorkoutRecovery: Boolean(
            previousEvent &&
              previousEvent.recoveryMode === "exercise",
          ),
          followsSocialLoad: Boolean(
            previousEvent &&
              previousEvent.effectiveType !== "recovery" &&
              isSocialEvent(previousEvent.title),
          ),
          followsQuietRecovery: Boolean(
            previousEvent &&
              previousEvent.recoveryMode === "quiet",
          ),
          precedingRecoveryMode:
            previousEvent?.effectiveType === "recovery" ? previousEvent.recoveryMode : null,
        });
      }
    }

    if (event.endTime > cursor) {
      cursor = event.endTime;
    }
  }

  if (cursor < sleep) {
    const durationMinutes = minutesBetween(cursor, sleep);

    if (durationMinutes >= 15) {
      windows.push({
        id: `${date.toISOString()}-${windows.length}`,
        date,
        start: cursor,
        end: sleep,
        durationMinutes,
        quality:
          durationMinutes >= (profile.deepWorkCapacity <= 2 ? 60 : 90)
            ? "deep"
            : durationMinutes >= 45
              ? "medium"
              : "light",
        demandBlocks,
        contextSwitchCount,
        adjacentDemandBefore: Boolean(
          clampedEvents.at(-1) &&
            clampedEvents.at(-1)?.effectiveType === "demand",
        ),
        adjacentDemandAfter: false,
        followsWorkoutRecovery: Boolean(
          clampedEvents.at(-1) &&
            clampedEvents.at(-1)?.recoveryMode === "exercise",
        ),
        followsSocialLoad: Boolean(
          clampedEvents.at(-1) &&
            clampedEvents.at(-1)?.effectiveType !== "recovery" &&
            isSocialEvent(clampedEvents.at(-1)?.title ?? ""),
        ),
        followsQuietRecovery: Boolean(
          clampedEvents.at(-1) && clampedEvents.at(-1)?.recoveryMode === "quiet",
        ),
        precedingRecoveryMode:
          clampedEvents.at(-1)?.effectiveType === "recovery"
            ? clampedEvents.at(-1)?.recoveryMode
            : null,
      });
    }
  }

  return windows;
}

function getPlanningEvents(
  events: CalendarEventSnapshot[],
  startDate: Date,
  endDate: Date,
) {
  return events.filter((event) => event.endTime > startDate && event.startTime < endDate);
}

export function detectTimeWindows(
  events: CalendarEventSnapshot[],
  profile: CognitiveProfileSnapshot,
  now = new Date(),
) {
  const start = startOfLocalDay(now);
  const end = addDays(start, DASHBOARD_DAYS);
  const planningEvents = interpretPlanningEvents(getPlanningEvents(events, start, end), profile);
  const days = eachDayOfInterval({ start, end: addDays(end, -1) });

  return days.flatMap((day) =>
    createWindowsForDay(
      day,
      planningEvents.filter(({ event }) => isSameDay(event.startTime, day)),
      profile,
    ),
  );
}

function taskNeedsDeepWindow(task: TaskSnapshot) {
  return (
    task.requiresUninterruptedBlock ||
    task.taskType === "deep_work" ||
    task.taskType === "problem_solving" ||
    task.taskType === "writing"
  );
}

function scoreTaskForWindow(
  task: TaskSnapshot,
  window: TimeWindow,
  profile: CognitiveProfileSnapshot,
  now: Date,
) {
  if (task.status !== "active") {
    return { score: -999, reasons: [] as string[] };
  }

  const hoursUntilDue = differenceInHours(task.dueAt, now);

  if (window.start > task.dueAt) {
    return { score: -999, reasons: [] as string[] };
  }

  let score = 20;
  const reasons: string[] = [];
  const highlyFragmentedProfile = profile.fragmentationCost >= 4;
  const lowFragmentationProfile = profile.fragmentationCost <= 2;

  if (taskNeedsDeepWindow(task)) {
    if (window.quality === "deep") {
      score += 25;
      reasons.push(`there is an uninterrupted ${window.durationMinutes}-minute block`);
    } else if (window.quality === "medium") {
      score += 8;
      reasons.push("the window is workable, but not ideal for longer concentration");
    } else {
      score -= 20;
      reasons.push("the gap is too fragmented for heavier focus");
    }

    if (highlyFragmentedProfile && window.quality !== "deep") {
      score -= 8;
      reasons.push("your profile loses a lot more usable output in broken time");
    }
  } else if (task.taskType === "reading" || task.taskType === "admin") {
    if (window.quality === "light") {
      score += lowFragmentationProfile ? 22 : 14;
      reasons.push(
        lowFragmentationProfile
          ? "shorter gaps are genuinely usable for this kind of work"
          : "shorter gaps can still carry lighter work",
      );
    }

    if (window.quality === "medium") {
      score += 10;
    }
  } else if (task.taskType === "errands_logistics" || task.taskType === "social_interpersonal") {
    score += window.quality === "light" ? 12 : 5;
  } else {
    score += window.quality === "medium" ? 14 : 4;
  }

  if (hoursUntilDue <= 72) {
    score += 16;
    reasons.push("the deadline is within the next 72 hours");
  }

  if (task.taskType === "writing" && profile.ambiguityTolerance <= 2) {
    score += 12;
    reasons.push("open-ended writing tends to go better with an earlier start");
  }

  if (task.emotionalFriction && task.emotionalFriction >= 4) {
    score += 6;
    reasons.push("higher-friction tasks benefit from protected momentum");
  }

  if (
    (task.taskType === "deep_work" || task.taskType === "problem_solving") &&
    (window.demandBlocks >= 3 || window.contextSwitchCount >= 5)
  ) {
    const switchingPenalty = profile.transitionCost >= 4 ? 15 : 8;
    score -= switchingPenalty;
    reasons.push(
      profile.transitionCost >= 4
        ? "the surrounding day carries enough switching to make this block less trustworthy"
        : "this day is already carrying a lot of context switching",
    );
  }

  if (window.followsSocialLoad && profile.overloadSensitivity >= 4) {
    score -= 8;
    reasons.push("this slot follows a socially heavy block");
  }

  if (window.followsWorkoutRecovery && profile.exerciseRecoveryValue >= 4) {
    score += 8;
    reasons.push("a restorative workout can make medium-load work easier afterward");
  }

  if (window.followsQuietRecovery && profile.quietRecoveryValue >= 4) {
    score += 8;
    reasons.push("a quiet reset beforehand can make this block more usable");
  }

  if (window.precedingRecoveryMode && profile.preferredRecoveryModes.includes(window.precedingRecoveryMode)) {
    score += window.precedingRecoveryMode === getTopRecoveryMode(profile) ? 9 : 5;
    reasons.push(
      `${getRecoveryModeLabel(window.precedingRecoveryMode)} tends to restore you better than generic downtime`,
    );
  }

  if (task.estimatedHours * 60 > window.durationMinutes && taskNeedsDeepWindow(task)) {
    score -= 4;
    reasons.push("this would likely be a strong starting block rather than the whole task");
  }

  return { score, reasons };
}

function explain(reasons: string[]) {
  const unique = Array.from(new Set(reasons)).slice(0, 3);
  return `Based on ${unique.join("; ")}.`;
}

function sumHours(minutes: number) {
  return Number((minutes / 60).toFixed(1));
}

export function buildWeeklyLoadMetrics(
  events: CalendarEventSnapshot[],
  tasks: TaskSnapshot[],
  profile: CognitiveProfileSnapshot,
  now = new Date(),
) {
  const start = startOfLocalDay(now);
  const end = addDays(start, DASHBOARD_DAYS);
  const planningEvents = getPlanningEvents(events, start, end);
  const interpretedEvents = interpretPlanningEvents(planningEvents, profile);
  const windows = detectTimeWindows(planningEvents, profile, now);
  const scheduledMinutes = planningEvents.reduce(
    (total, event) => total + minutesBetween(event.startTime, event.endTime),
    0,
  );
  const freeMinutes = windows.reduce((total, window) => total + window.durationMinutes, 0);
  const deepMinutes = windows
    .filter((window) => window.quality === "deep")
    .reduce((total, window) => total + window.durationMinutes, 0);
  const activeTasks = tasks.filter((task) => task.status === "active");
  const relevantTasks = activeTasks.filter((task) => task.dueAt <= end);
  const majorDeadlines = relevantTasks.filter((task) => task.estimatedHours >= 2).length;
  const highFrictionTasks = relevantTasks.filter(
    (task) =>
      task.requiresUninterruptedBlock ||
      (task.ambiguityLevel ?? 0) >= 4 ||
      (task.emotionalFriction ?? 0) >= 4,
  ).length;
  const recoveryEvents = interpretedEvents.filter((event) => event.effectiveType === "recovery");
  const recoveryBlockCount = recoveryEvents.length;
  const deepWorkNeededHours = relevantTasks
    .filter(taskNeedsDeepWindow)
    .reduce((total, task) => total + task.estimatedHours, 0);
  const days = eachDayOfInterval({ start, end: addDays(end, -1) });
  const highDemandDays = days.filter((day) => {
    const dayEvents = interpretedEvents.filter(({ event }) => isSameDay(event.startTime, day));
    const demandCount = dayEvents.filter((event) => event.effectiveType === "demand").length;
    return demandCount >= 3;
  }).length;
  const switchHeavyDays = days.filter((day) => {
    const dayEvents = interpretedEvents.filter(({ event }) => isSameDay(event.startTime, day));
    return dayEvents.length >= getSwitchHeavyThreshold(profile);
  }).length;

  const deepWorkCapableHours = sumHours(deepMinutes);
  const shortageHours = Math.max(0, deepWorkNeededHours - deepWorkCapableHours);
  const fragmentedWindowCount = windows.filter((window) => window.quality === "light").length;
  const fragmentedDays = days.filter((day) => {
    const dayEvents = interpretedEvents.filter(({ event }) => isSameDay(event.startTime, day));
    return dayEvents.length >= 3;
  }).length;
  const fragmentationPenalty =
    (fragmentedWindowCount + fragmentedDays) * Math.max(profile.fragmentationCost - 2, 0) * 2.5;
  const transitionPenalty =
    switchHeavyDays * Math.max(profile.transitionCost - 2, 0) * 3;
  const preferredRecoveryMode = getTopRecoveryMode(profile);
  const preferredModeRecoveryCount = recoveryEvents.filter(
    (event) => event.recoveryMode === preferredRecoveryMode,
  ).length;
  const recoveryMismatchPenalty =
    preferredModeRecoveryCount === 0 &&
    getRecoveryValueForMode(profile, preferredRecoveryMode) >= 4
      ? 10
      : 0;
  const overloadRiskScore = clamp(
    majorDeadlines * 12 +
      highFrictionTasks * 8 +
      highDemandDays * 7 +
      shortageHours * 10 +
      fragmentationPenalty +
      transitionPenalty +
      recoveryMismatchPenalty +
      profile.overloadSensitivity * 3 +
      profile.overcommitmentRisk * 4,
    0,
    100,
  );
  const highlightedRisks = [
    ...(shortageHours > 0
      ? [deepWorkNeededHours > deepWorkCapableHours
          ? "Protected work windows are tighter than your heavier tasks require."
          : null]
      : []),
    ...(profile.fragmentationCost >= 4 && (fragmentedWindowCount >= 2 || fragmentedDays >= 1)
      ? ["Broken time is likely to look more usable on paper than it will feel in practice."]
      : []),
    ...(profile.transitionCost >= 4 && switchHeavyDays >= 2
      ? ["Context switching is likely to erode otherwise workable blocks this week."]
      : []),
    ...(preferredModeRecoveryCount === 0 && recoveryMismatchPenalty > 0
      ? [`Your best ${getRecoveryModeLabel(preferredRecoveryMode)} is barely visible in the current week.`]
      : []),
    ...(overloadRiskScore >= 55
      ? ["The overall week is carrying enough pressure that small slips will compound quickly."]
      : []),
  ].filter((value): value is string => Boolean(value)).slice(0, 4);
  const restorativeHighlights = recoveryEvents
    .sort((left, right) => {
      const leftRank = profile.preferredRecoveryModes.indexOf(left.recoveryMode ?? "quiet");
      const rightRank = profile.preferredRecoveryModes.indexOf(right.recoveryMode ?? "quiet");
      return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
    })
    .slice(0, 2)
    .map(({ event, recoveryMode }) =>
      recoveryMode
        ? `${event.title} aligns with your ${getRecoveryModeLabel(recoveryMode)}.`
        : `${event.title} looks genuinely restorative.`,
    );
  const recoveryGuidance =
    restorativeHighlights[0] ??
    (preferredModeRecoveryCount === 0
      ? `Protect more ${getRecoveryModeLabel(preferredRecoveryMode)} if you want the heavier work to stay usable later in the week.`
      : "Recovery is visible in the week, but it will help more if you leave demanding work around it lighter.");

  const metrics: WeeklyLoadMetrics = {
    scheduledHours: sumHours(scheduledMinutes),
    freeHours: sumHours(freeMinutes),
    deepWorkCapableHours,
    majorDeadlines,
    highFrictionTasks,
    recoveryBlockCount,
    overloadRiskScore,
    deepWorkMismatch: shortageHours > 0,
    deepWorkMismatchMessage:
      shortageHours > 0
        ? `You likely need about ${shortageHours.toFixed(1)} more deep-work hours than the week currently offers.`
        : "Your deeper tasks fit the current week reasonably well.",
    highlightedRisks,
    restorativeHighlights,
    recoveryGuidance,
  };

  return { metrics, windows, interpretedEvents };
}

export function generateRecommendationDrafts(
  events: CalendarEventSnapshot[],
  tasks: TaskSnapshot[],
  profile: CognitiveProfileSnapshot,
  now = new Date(),
) {
  const { metrics, windows, interpretedEvents } = buildWeeklyLoadMetrics(events, tasks, profile, now);
  const activeTasks = tasks.filter((task) => task.status === "active");
  const scored = activeTasks.flatMap((task) =>
    windows.map((window) => ({
      task,
      window,
      ...scoreTaskForWindow(task, window, profile, now),
    })),
  );
  const viable = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const drafts: RecommendationDraft[] = [];
  const todayCandidate = viable.find((entry) => isSameDay(entry.window.start, now));

  if (todayCandidate) {
    drafts.push({
      recommendationType: "today_focus",
      taskId: todayCandidate.task.id,
      summary: `Use today's best-fit window for ${todayCandidate.task.title}.`,
      explanation: explain(todayCandidate.reasons),
      score: todayCandidate.score,
      suggestedStart: todayCandidate.window.start,
      suggestedEnd: todayCandidate.window.end,
    });
  }

  const earlyStartCandidate = viable.find(
    (entry) =>
      entry.task.taskType === "writing" ||
      entry.task.taskType === "deep_work" ||
      entry.task.taskType === "problem_solving",
  );

  if (earlyStartCandidate) {
    const earlyStartFraming =
      profile.fragmentationCost >= 4
        ? "later windows are less reliable once the week gets more broken up"
        : profile.transitionCost >= 4
          ? "later windows will likely carry more switching and less continuity"
          : "later windows are less reliable for heavier work";
    drafts.push({
      recommendationType: "start_early",
      taskId: earlyStartCandidate.task.id,
      summary: `Start ${earlyStartCandidate.task.title} before the week gets less usable.`,
      explanation: explain([
        ...earlyStartCandidate.reasons,
        earlyStartFraming,
      ]),
      score: earlyStartCandidate.score - 3,
      suggestedStart: earlyStartCandidate.window.start,
      suggestedEnd: earlyStartCandidate.window.end,
    });
  }

  const fragmentedCandidate = viable.find(
    (entry) =>
      entry.window.quality === "light" &&
      (entry.task.taskType === "reading" ||
        entry.task.taskType === "admin" ||
        entry.task.taskType === "errands_logistics"),
  );

  if (fragmentedCandidate) {
    drafts.push({
      recommendationType: "fragmented_fit",
      taskId: fragmentedCandidate.task.id,
      summary:
        profile.fragmentationCost <= 2
          ? `A shorter gap is a genuine fit for ${fragmentedCandidate.task.title}.`
          : `Use a shorter gap carefully for ${fragmentedCandidate.task.title}.`,
      explanation: explain([
        ...fragmentedCandidate.reasons,
        profile.fragmentationCost <= 2
          ? "your profile can convert smaller windows into usable output"
          : "smaller windows still need tasks with low setup cost",
      ]),
      score: fragmentedCandidate.score,
      suggestedStart: fragmentedCandidate.window.start,
      suggestedEnd: fragmentedCandidate.window.end,
    });
  }

  if (metrics.overloadRiskScore >= 55) {
    const overloadSpecificReason =
      profile.fragmentationCost >= 4
        ? "broken time is likely to create hidden load on top of the raw schedule"
        : profile.transitionCost >= 4
          ? "the week's switching cost is likely to be higher than the calendar suggests"
          : `${metrics.highFrictionTasks} tasks carry extra friction`;
    drafts.push({
      recommendationType: "overload_warning",
      summary: "The upcoming week looks crowded for the kind of work you need to do.",
      explanation: explain([
        `${metrics.majorDeadlines} major deadlines are clustering`,
        overloadSpecificReason,
        `your overload risk is ${metrics.overloadRiskScore}/100`,
      ]),
      score: metrics.overloadRiskScore,
    });
  }

  if (metrics.recoveryBlockCount < 2) {
    const topRecoveryMode = getTopRecoveryMode(profile);
    drafts.push({
      recommendationType: "recovery_note",
      summary:
        topRecoveryMode === "quiet"
          ? "Your week is light on quiet reset windows."
          : topRecoveryMode === "exercise"
            ? "Your week is light on movement-based recovery."
            : "Your week is light on clearly restorative social time.",
      explanation: explain([
        `only ${metrics.recoveryBlockCount} recovery blocks are currently visible`,
        metrics.recoveryGuidance.replace(/\.$/, ""),
      ]),
      score: 58,
    });
  } else {
    const recoveryEvent = interpretedEvents.find(
      ({ effectiveType, event }) => effectiveType === "recovery" && event.startTime > now,
    );

    if (recoveryEvent) {
      drafts.push({
        recommendationType: "recovery_note",
        summary:
          recoveryEvent.recoveryMode
            ? `${recoveryEvent.event.title} looks like a real ${getRecoveryModeLabel(recoveryEvent.recoveryMode)} this week.`
            : `${recoveryEvent.event.title} looks like a genuine recovery block this week.`,
        explanation: explain([
          "recovery time is being treated as part of the plan, not lost time",
          metrics.recoveryGuidance.replace(/\.$/, ""),
        ]),
        score: 52,
      });
    }
  }

  if (metrics.deepWorkMismatch) {
    drafts.push({
      recommendationType: "deep_work_shortage",
      summary: "Your deeper tasks are competing for too few protected work windows.",
      explanation: explain([
        metrics.deepWorkMismatchMessage.replace(/\.$/, ""),
        "starting heavier work earlier will lower compression later in the week",
      ]),
      score: 70,
    });
  }

  return { drafts, metrics, windows };
}
