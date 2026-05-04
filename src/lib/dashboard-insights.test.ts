import { describe, expect, it } from "vitest";
import { buildPlanningStyleRead, buildRecoveryIslandsInsight } from "@/lib/dashboard-insights";
import type { ClassifiedWeekEvent, CognitiveProfileSnapshot, WeekAnalysisMetrics } from "@/lib/domain";

function makeProfile(
  overrides: Partial<CognitiveProfileSnapshot> = {},
): CognitiveProfileSnapshot {
  return {
    subtypeName: "Protected-Block Planner",
    subtypeDescription:
      "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
    shortSummary:
      "Your week works best when deep work is protected before smaller commitments fill the space.",
    overloadSensitivity: 4,
    fragmentationCost: 4,
    transitionCost: 4,
    deepWorkCapacity: 4,
    ambiguityTolerance: 2,
    routinePreference: 4,
    socialRecoveryValue: 3,
    exerciseRecoveryValue: 4,
    quietRecoveryValue: 4,
    overcommitmentRisk: 4,
    preferredRecoveryModes: ["quiet", "exercise", "social"],
    ...overrides,
  };
}

function makeMetrics(): WeekAnalysisMetrics {
  return {
    totalCommittedMinutes: 420,
    totalOpenMinutes: 540,
    overallLoadScore: 58,
    scheduledLoadScore: 49,
    latentDemandMinutes: 120,
    availableMarginMinutes: 250,
    committedHoursByDay: [
      { label: "Monday", committedHours: 3.5 },
      { label: "Tuesday", committedHours: 2.5 },
    ],
    dailyLoadScores: [],
    dailyLoadDebug: [],
    weeklyLoadDebug: {
      scheduledWeeklyRawScoreBeforeLatent: 31,
      evaluativeLoadContribution: 0,
      anticipatoryExamContribution: 0,
      latentDemandContribution: 6,
      summedDailyRawScore: 37,
      averageDailyRawScore: 5.3,
      multiDayPatternPenalties: 3,
      weeklyAggregationPenalty: 1.2,
      recoveryCredits: 1,
      weeklyStabilizingCredits: 1,
      supportFactor: 0.95,
      weeklyRawScoreBeforeScaling: 35,
      finalWeeklyDisplayScore: 58,
    },
    freeBlocksByDay: [],
    medianFreeBlockMinutes: 60,
    freeBlockCount30: 4,
    freeBlockCount60: 3,
    freeBlockCount90: 2,
    fragmentationBurden: 3.4,
    protectedBlockAvailability: 2,
    loadConcentration: 0.31,
    morningUsableMinutes: 120,
    afternoonUsableMinutes: 180,
    transitionDensity: 1.1,
    eventTypeCounts: { class: 2, exercise: 1, social: 1 },
    externallyStructuredCount: 2,
    socialCount: 1,
    exerciseCount: 1,
    workClassMinutes: 180,
    meetingsStructuredMinutes: 60,
    socialMinutes: 60,
    recoverySoloMinutes: 120,
    squeezedOpenBlockCount: 2,
    bufferedOpenBlockCount: 2,
    weekShapeDays: [
      {
        label: "Mon",
        date: new Date("2026-04-20T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 1,
        segments: [
          { kind: "event", startMinute: 180, endMinute: 240, eventType: "exercise" },
          { kind: "open", startMinute: 300, endMinute: 430, emphasis: "focus" },
        ],
      },
      {
        label: "Tue",
        date: new Date("2026-04-21T00:00:00.000Z"),
        committedMinutes: 120,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [
          { kind: "event", startMinute: 420, endMinute: 480, eventType: "social" },
          { kind: "event", startMinute: 500, endMinute: 545, eventType: "meal" },
        ],
      },
    ],
  };
}

function makeCanonicalRecoveryEvent(overrides: Partial<ClassifiedWeekEvent> = {}): ClassifiedWeekEvent {
  return {
    title: "Lunch",
    normalizedTitle: "lunch",
    startTime: new Date("2026-04-20T19:00:00.000Z"),
    endTime: new Date("2026-04-20T20:00:00.000Z"),
    clippedStartTime: new Date("2026-04-20T19:00:00.000Z"),
    clippedEndTime: new Date("2026-04-20T20:00:00.000Z"),
    allDay: false,
    isAllDayLike: false,
    durationMinutes: 60,
    rawDurationHours: 1,
    countedDurationHours: 1,
    eventType: "meal",
    compositionCategory: "recovery_solo",
    recoveryCategory: "care",
    trajectoryLoadCategory: "support",
    matchedRule: "meal_keyword",
    sourceCalendar: "primary",
    sourceCalendarId: "primary",
    includeInComposition: true,
    includeInRecoveryIslands: true,
    includeInTrajectory: true,
    confidence: "high",
    classificationSource: "keyword_rule",
    ...overrides,
  };
}

describe("dashboard insights", () => {
  it("produces subtype-sensitive recovery interpretation when visible recovery exists", () => {
    const metrics = makeMetrics();
    const exerciseProfile = makeProfile({ exerciseRecoveryValue: 5, quietRecoveryValue: 2 });
    const quietProfile = makeProfile({ exerciseRecoveryValue: 2, quietRecoveryValue: 5 });

    const exerciseRead = buildRecoveryIslandsInsight(metrics, exerciseProfile);
    const quietRead = buildRecoveryIslandsInsight(metrics, quietProfile);

    expect(exerciseRead.profileBestWith).not.toEqual(quietRead.profileBestWith);
    expect(exerciseRead.days.some((day) => day.totalRecoveryMinutes > 0)).toBe(true);
    expect(exerciseRead.idealRecoveryLine).not.toEqual(quietRead.idealRecoveryLine);
    expect(exerciseRead.detectableRecoveryBlockCount).toBeGreaterThanOrEqual(2);
  });

  it("produces a profile-aware planning-style read", () => {
    const metrics = makeMetrics();
    const highTransitionProfile = makeProfile({ transitionCost: 5 });
    const quieterProfile = makeProfile({ transitionCost: 2, quietRecoveryValue: 5 });

    const transitionRead = buildPlanningStyleRead(metrics, highTransitionProfile);
    const quietRead = buildPlanningStyleRead(metrics, quieterProfile);

    expect(transitionRead.headline).not.toEqual(quietRead.headline);
  });

  it("does not treat broad open time as recovery islands by default", () => {
    const metrics = makeMetrics();
    metrics.weekShapeDays = [
      {
        label: "Mon",
        date: new Date("2026-04-20T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [{ kind: "open", startMinute: 300, endMinute: 390, emphasis: "focus" }],
      },
      {
        label: "Tue",
        date: new Date("2026-04-21T00:00:00.000Z"),
        committedMinutes: 120,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [{ kind: "open", startMinute: 420, endMinute: 510, emphasis: "focus" }],
      },
    ];

    const read = buildRecoveryIslandsInsight(metrics, makeProfile());

    expect(read.detectableRecoveryBlockCount).toBe(0);
    expect(read.totalRecoveryMinutes).toBe(0);
  });

  it("does not count overnight or massive empty stretches as unlimited recovery", () => {
    const metrics = makeMetrics();
    metrics.weekShapeDays = [
      {
        label: "Sat",
        date: new Date("2026-04-25T00:00:00.000Z"),
        committedMinutes: 0,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [
          { kind: "open", startMinute: 0, endMinute: 960, emphasis: "focus" },
        ],
      },
    ];

    const read = buildRecoveryIslandsInsight(metrics, makeProfile());
    const saturday = read.days[0];

    expect(saturday?.totalRecoveryMinutes).toBe(0);
    expect(read.totalRecoveryMinutes).toBeLessThanOrEqual(180);
  });

  it("limits visible unplanned buffer and keeps it separate from scheduled recovery totals", () => {
    const metrics = makeMetrics();
    metrics.weekShapeDays = [
      {
        label: "Mon",
        date: new Date("2026-04-20T00:00:00.000Z"),
        committedMinutes: 240,
        focusWindowCount: 1,
        fragmentedWindowCount: 1,
        segments: [
          { kind: "event", startMinute: 120, endMinute: 180, eventType: "meal" },
          { kind: "open", startMinute: 210, endMinute: 320, emphasis: "fragmented" },
        ],
      },
      {
        label: "Tue",
        date: new Date("2026-04-21T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 1,
        segments: [{ kind: "open", startMinute: 360, endMinute: 470, emphasis: "fragmented" }],
      },
      {
        label: "Wed",
        date: new Date("2026-04-22T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 1,
        segments: [{ kind: "open", startMinute: 480, endMinute: 590, emphasis: "fragmented" }],
      },
      {
        label: "Thu",
        date: new Date("2026-04-23T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 1,
        segments: [{ kind: "open", startMinute: 540, endMinute: 650, emphasis: "fragmented" }],
      },
    ];

    const read = buildRecoveryIslandsInsight(metrics, makeProfile());
    const openSegments = read.days.flatMap((day) => day.segments.filter((segment) => segment.tone === "open"));

    expect(openSegments.length).toBeLessThanOrEqual(3);
    expect(read.totalRecoveryMinutes).toBe(60);
    expect(read.usableBufferMinutes).toBeGreaterThan(0);
  });

  it("can fall below the recovery panel visibility threshold", () => {
    const metrics = makeMetrics();
    metrics.weekShapeDays = [
      {
        label: "Mon",
        date: new Date("2026-04-20T00:00:00.000Z"),
        committedMinutes: 180,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [{ kind: "event", startMinute: 180, endMinute: 220, eventType: "meal" }],
      },
      {
        label: "Tue",
        date: new Date("2026-04-21T00:00:00.000Z"),
        committedMinutes: 120,
        focusWindowCount: 1,
        fragmentedWindowCount: 0,
        segments: [],
      },
    ];

    const read = buildRecoveryIslandsInsight(metrics, makeProfile());

    expect(read.detectableRecoveryBlockCount).toBeLessThan(2);
  });

  it("includes obvious meal events in recovery islands as care support", () => {
    const metrics = makeMetrics();
    const canonicalEvents = [
      makeCanonicalRecoveryEvent(),
      makeCanonicalRecoveryEvent({
        title: "Lunch with Maya",
        normalizedTitle: "lunch with maya",
        startTime: new Date("2026-04-21T19:30:00.000Z"),
        endTime: new Date("2026-04-21T20:30:00.000Z"),
        clippedStartTime: new Date("2026-04-21T19:30:00.000Z"),
        clippedEndTime: new Date("2026-04-21T20:30:00.000Z"),
      }),
      makeCanonicalRecoveryEvent({
        title: "quick brekky at home",
        normalizedTitle: "quick brekky at home",
        startTime: new Date("2026-04-22T15:30:00.000Z"),
        endTime: new Date("2026-04-22T16:00:00.000Z"),
        clippedStartTime: new Date("2026-04-22T15:30:00.000Z"),
        clippedEndTime: new Date("2026-04-22T16:00:00.000Z"),
      }),
    ];

    const read = buildRecoveryIslandsInsight(canonicalEvents, metrics, makeProfile());

    expect(read.detectableRecoveryBlockCount).toBe(2);
    expect(read.days.flatMap((day) => day.segments).some((segment) => segment.tone === "care")).toBe(true);
  });
});
