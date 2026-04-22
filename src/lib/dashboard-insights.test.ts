import { describe, expect, it } from "vitest";
import { buildPlanningStyleRead, buildRecoveryIslandsInsight } from "@/lib/dashboard-insights";
import type { CognitiveProfileSnapshot, WeekAnalysisMetrics } from "@/lib/domain";

function makeProfile(
  overrides: Partial<CognitiveProfileSnapshot> = {},
): CognitiveProfileSnapshot {
  return {
    subtypeName: "Protected-Block Planner",
    subtypeDescription:
      "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
    shortSummary:
      "Protected time matters more than how much open time the week appears to have.",
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

describe("dashboard insights", () => {
  it("produces subtype-sensitive recovery interpretation when visible recovery exists", () => {
    const metrics = makeMetrics();
    const exerciseProfile = makeProfile({ exerciseRecoveryValue: 5, quietRecoveryValue: 2 });
    const quietProfile = makeProfile({ exerciseRecoveryValue: 2, quietRecoveryValue: 5 });

    const exerciseRead = buildRecoveryIslandsInsight(metrics, exerciseProfile);
    const quietRead = buildRecoveryIslandsInsight(metrics, quietProfile);

    expect(exerciseRead.supportingLine).not.toEqual(quietRead.supportingLine);
    expect(exerciseRead.days.some((day) => day.totalRecoveryMinutes > 0)).toBe(true);
  });

  it("produces a profile-aware planning-style read", () => {
    const metrics = makeMetrics();
    const highTransitionProfile = makeProfile({ transitionCost: 5 });
    const quieterProfile = makeProfile({ transitionCost: 2, quietRecoveryValue: 5 });

    const transitionRead = buildPlanningStyleRead(metrics, highTransitionProfile);
    const quietRead = buildPlanningStyleRead(metrics, quieterProfile);

    expect(transitionRead.headline).not.toEqual(quietRead.headline);
  });
});
