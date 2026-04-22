import { describe, expect, it } from "vitest";
import {
  buildWeekAnalysisRecordData,
  createWeekAnalysisReport,
  normalizeWeekAnalysisMetrics,
  toDisplayLoadScore,
} from "@/lib/week-analysis";
import type { ClassifiedWeekEvent, CognitiveProfileSnapshot } from "@/lib/domain";

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

const busyWeek: ClassifiedWeekEvent[] = [
  {
    startTime: new Date("2026-04-21T16:00:00.000Z"),
    endTime: new Date("2026-04-21T17:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "class",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T18:00:00.000Z"),
    endTime: new Date("2026-04-21T18:45:00.000Z"),
    allDay: false,
    durationMinutes: 45,
    eventType: "work_meeting",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T20:00:00.000Z"),
    endTime: new Date("2026-04-21T21:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "social",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T17:00:00.000Z"),
    endTime: new Date("2026-04-22T18:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "class",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T18:30:00.000Z"),
    endTime: new Date("2026-04-22T19:00:00.000Z"),
    allDay: false,
    durationMinutes: 30,
    eventType: "admin",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T20:00:00.000Z"),
    endTime: new Date("2026-04-22T21:30:00.000Z"),
    allDay: false,
    durationMinutes: 90,
    eventType: "exercise",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-24T16:30:00.000Z"),
    endTime: new Date("2026-04-24T19:30:00.000Z"),
    allDay: false,
    durationMinutes: 180,
    eventType: "deep_work",
    confidence: "medium",
    classificationSource: "keyword_rule",
  },
];

const extremeWeek: ClassifiedWeekEvent[] = Array.from({ length: 5 }, (_, dayOffset) => {
  const day = 21 + dayOffset;

  return [
    {
      startTime: new Date(`2026-04-${day}T15:00:00.000Z`),
      endTime: new Date(`2026-04-${day}T16:30:00.000Z`),
      allDay: false,
      durationMinutes: 90,
      eventType: "class" as const,
      confidence: "high" as const,
      classificationSource: "keyword_rule" as const,
    },
    {
      startTime: new Date(`2026-04-${day}T16:45:00.000Z`),
      endTime: new Date(`2026-04-${day}T17:45:00.000Z`),
      allDay: false,
      durationMinutes: 60,
      eventType: "work_meeting" as const,
      confidence: "high" as const,
      classificationSource: "keyword_rule" as const,
    },
    {
      startTime: new Date(`2026-04-${day}T18:00:00.000Z`),
      endTime: new Date(`2026-04-${day}T19:30:00.000Z`),
      allDay: false,
      durationMinutes: 90,
      eventType: "appointment" as const,
      confidence: "high" as const,
      classificationSource: "keyword_rule" as const,
    },
    {
      startTime: new Date(`2026-04-${day}T19:45:00.000Z`),
      endTime: new Date(`2026-04-${day}T20:45:00.000Z`),
      allDay: false,
      durationMinutes: 60,
      eventType: "social" as const,
      confidence: "medium" as const,
      classificationSource: "keyword_rule" as const,
    },
    {
      startTime: new Date(`2026-04-${day}T21:00:00.000Z`),
      endTime: new Date(`2026-04-${day}T22:30:00.000Z`),
      allDay: false,
      durationMinutes: 90,
      eventType: "commute" as const,
      confidence: "medium" as const,
      classificationSource: "keyword_rule" as const,
    },
  ];
}).flat();

const structuredSupportedWeek: ClassifiedWeekEvent[] = [
  {
    startTime: new Date("2026-04-21T16:00:00.000Z"),
    endTime: new Date("2026-04-21T18:00:00.000Z"),
    allDay: false,
    durationMinutes: 120,
    eventType: "class",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T18:30:00.000Z"),
    endTime: new Date("2026-04-21T19:15:00.000Z"),
    allDay: false,
    durationMinutes: 45,
    eventType: "meal",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T20:00:00.000Z"),
    endTime: new Date("2026-04-21T21:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "exercise",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T16:00:00.000Z"),
    endTime: new Date("2026-04-22T17:30:00.000Z"),
    allDay: false,
    durationMinutes: 90,
    eventType: "class",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T18:00:00.000Z"),
    endTime: new Date("2026-04-22T19:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "social",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-23T16:00:00.000Z"),
    endTime: new Date("2026-04-23T17:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "work_meeting",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-23T17:30:00.000Z"),
    endTime: new Date("2026-04-23T18:15:00.000Z"),
    allDay: false,
    durationMinutes: 45,
    eventType: "meal",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-24T16:00:00.000Z"),
    endTime: new Date("2026-04-24T18:00:00.000Z"),
    allDay: false,
    durationMinutes: 120,
    eventType: "deep_work",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-24T18:30:00.000Z"),
    endTime: new Date("2026-04-24T19:30:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "social",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
];

const similarlyBusyDemandWeek: ClassifiedWeekEvent[] = [
  {
    startTime: new Date("2026-04-21T16:00:00.000Z"),
    endTime: new Date("2026-04-21T18:00:00.000Z"),
    allDay: false,
    durationMinutes: 120,
    eventType: "class",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T18:30:00.000Z"),
    endTime: new Date("2026-04-21T19:15:00.000Z"),
    allDay: false,
    durationMinutes: 45,
    eventType: "admin",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-21T20:00:00.000Z"),
    endTime: new Date("2026-04-21T21:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "work_meeting",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T16:00:00.000Z"),
    endTime: new Date("2026-04-22T17:30:00.000Z"),
    allDay: false,
    durationMinutes: 90,
    eventType: "class",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-22T18:00:00.000Z"),
    endTime: new Date("2026-04-22T19:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "work_meeting",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-23T16:00:00.000Z"),
    endTime: new Date("2026-04-23T17:00:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "work_meeting",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-23T17:30:00.000Z"),
    endTime: new Date("2026-04-23T18:15:00.000Z"),
    allDay: false,
    durationMinutes: 45,
    eventType: "appointment",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-24T16:00:00.000Z"),
    endTime: new Date("2026-04-24T18:00:00.000Z"),
    allDay: false,
    durationMinutes: 120,
    eventType: "deep_work",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
  {
    startTime: new Date("2026-04-24T18:30:00.000Z"),
    endTime: new Date("2026-04-24T19:30:00.000Z"),
    allDay: false,
    durationMinutes: 60,
    eventType: "admin",
    confidence: "high",
    classificationSource: "keyword_rule",
  },
];

describe("toDisplayLoadScore", () => {
  it("always returns an integer between 0 and 99", () => {
    expect(toDisplayLoadScore(-10)).toBe(0);
    expect(Number.isInteger(toDisplayLoadScore(32.4))).toBe(true);
    expect(toDisplayLoadScore(10_000)).toBeLessThanOrEqual(99);
    expect(toDisplayLoadScore(10_000)).not.toBe(100);
  });

  it("tracks the calibrated raw-score anchors without saturating too early", () => {
    expect(toDisplayLoadScore(3)).toBeGreaterThanOrEqual(15);
    expect(toDisplayLoadScore(3)).toBeLessThanOrEqual(25);

    expect(toDisplayLoadScore(5)).toBeGreaterThanOrEqual(25);
    expect(toDisplayLoadScore(5)).toBeLessThanOrEqual(35);

    expect(toDisplayLoadScore(9)).toBeGreaterThanOrEqual(35);
    expect(toDisplayLoadScore(9)).toBeLessThanOrEqual(50);

    expect(toDisplayLoadScore(15)).toBeGreaterThanOrEqual(40);
    expect(toDisplayLoadScore(15)).toBeLessThanOrEqual(65);

    expect(toDisplayLoadScore(30)).toBeGreaterThanOrEqual(55);
    expect(toDisplayLoadScore(30)).toBeLessThanOrEqual(80);

    expect(toDisplayLoadScore(50)).toBeGreaterThanOrEqual(70);
    expect(toDisplayLoadScore(50)).toBeLessThanOrEqual(90);

    expect(toDisplayLoadScore(70)).toBeGreaterThanOrEqual(80);
    expect(toDisplayLoadScore(70)).toBeLessThanOrEqual(99);

    expect(toDisplayLoadScore(90)).toBeGreaterThanOrEqual(95);
    expect(toDisplayLoadScore(90)).toBeLessThanOrEqual(99);
  });

  it("preserves visible differences across a wide realistic raw range", () => {
    const low = toDisplayLoadScore(4);
    const moderate = toDisplayLoadScore(9);
    const elevated = toDisplayLoadScore(18);
    const heavy = toDisplayLoadScore(50);
    const extreme = toDisplayLoadScore(70);

    expect(moderate).toBeGreaterThan(low);
    expect(elevated).toBeGreaterThan(moderate);
    expect(heavy).toBeGreaterThan(elevated);
    expect(extreme).toBeGreaterThan(heavy);
    expect(extreme - low).toBeGreaterThanOrEqual(45);
    expect(extreme).toBeLessThanOrEqual(99);
  });

  it("does not map low raw values into near-max display scores", () => {
    expect(toDisplayLoadScore(3.96)).toBeLessThanOrEqual(35);
    expect(toDisplayLoadScore(9.33)).toBeLessThanOrEqual(50);
    expect(toDisplayLoadScore(13.43)).toBeLessThanOrEqual(65);
    expect(toDisplayLoadScore(50)).toBeGreaterThanOrEqual(75);
  });
});

describe("createWeekAnalysisReport", () => {
  it("changes observations and suggestions when the profile changes materially", () => {
    const structuredProfile = makeProfile({
      fragmentationCost: 5,
      transitionCost: 5,
      deepWorkCapacity: 5,
    });
    const flexibleProfile = makeProfile({
      subtypeName: "Adaptive Generalist",
      fragmentationCost: 2,
      transitionCost: 2,
      deepWorkCapacity: 2,
      overloadSensitivity: 2,
      overcommitmentRisk: 2,
    });

    const structuredReport = createWeekAnalysisReport(
      busyWeek,
      structuredProfile,
      new Date("2026-04-20T08:00:00.000Z"),
    );
    const flexibleReport = createWeekAnalysisReport(
      busyWeek,
      flexibleProfile,
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(structuredReport.observations).not.toEqual(flexibleReport.observations);
    expect(structuredReport.suggestions).not.toEqual(flexibleReport.suggestions);
  });

  it("tracks composition and open-time totals for the dashboard", () => {
    const report = createWeekAnalysisReport(
      busyWeek,
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(report.derivedMetrics.totalCommittedMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.totalOpenMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.workClassMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.meetingsStructuredMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.socialMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.recoverySoloMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.overallLoadScore).toBeGreaterThanOrEqual(0);
    expect(report.derivedMetrics.overallLoadScore).toBeLessThanOrEqual(99);
    expect(report.derivedMetrics.dailyLoadScores).toHaveLength(7);
    expect(report.derivedMetrics.dailyLoadDebug).toHaveLength(7);
    expect(report.derivedMetrics.dailyLoadScores.every((day) => day.score >= 0 && day.score <= 99)).toBe(true);
    expect(report.derivedMetrics.overallLoadScore).toBe(
      Math.round(
        report.derivedMetrics.dailyLoadScores.reduce((sum, day) => sum + day.score, 0) /
          report.derivedMetrics.dailyLoadScores.length,
      ),
    );
  });

  it("treats supported structured weeks as less strained than similarly busy demand weeks", () => {
    const supported = createWeekAnalysisReport(
      structuredSupportedWeek,
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );
    const demandHeavy = createWeekAnalysisReport(
      similarlyBusyDemandWeek,
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(supported.derivedMetrics.totalCommittedMinutes).toBe(similarlyBusyDemandWeek.reduce((sum, event) => sum + event.durationMinutes, 0));
    expect(supported.derivedMetrics.overallLoadScore).toBeLessThan(demandHeavy.derivedMetrics.overallLoadScore);
    expect(supported.derivedMetrics.dailyLoadDebug.some((day) => day.supportSubtotal > 0)).toBe(true);
  });

  it("keeps a representative structured student week out of extreme strain by default", () => {
    const representativeStudentWeek = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T18:00:00.000Z"),
          endTime: new Date("2026-04-21T20:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "deep_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T20:15:00.000Z"),
          endTime: new Date("2026-04-21T21:00:00.000Z"),
          allDay: false,
          durationMinutes: 45,
          eventType: "meal",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T16:00:00.000Z"),
          endTime: new Date("2026-04-22T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T18:00:00.000Z"),
          endTime: new Date("2026-04-22T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "exercise",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T19:30:00.000Z"),
          endTime: new Date("2026-04-22T20:30:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T16:00:00.000Z"),
          endTime: new Date("2026-04-23T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T17:30:00.000Z"),
          endTime: new Date("2026-04-23T19:30:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "deep_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T19:45:00.000Z"),
          endTime: new Date("2026-04-23T20:30:00.000Z"),
          allDay: false,
          durationMinutes: 45,
          eventType: "meal",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T16:00:00.000Z"),
          endTime: new Date("2026-04-24T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T18:00:00.000Z"),
          endTime: new Date("2026-04-24T20:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "deep_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T18:00:00.000Z"),
          endTime: new Date("2026-04-25T19:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(representativeStudentWeek.derivedMetrics.overallLoadScore).toBe(
      Math.round(
        representativeStudentWeek.derivedMetrics.dailyLoadScores.reduce((sum, day) => sum + day.score, 0) /
          representativeStudentWeek.derivedMetrics.dailyLoadScores.length,
      ),
    );
    expect(new Set(representativeStudentWeek.derivedMetrics.dailyLoadScores.map((day) => day.score)).size).toBeGreaterThan(1);
    expect(representativeStudentWeek.derivedMetrics.dailyLoadScores.every((day) => day.score !== 99)).toBe(true);
  });

  it("maps days into stable operating modes based on what the day can realistically support", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T15:00:00.000Z"),
          endTime: new Date("2026-04-21T16:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T18:00:00.000Z"),
          endTime: new Date("2026-04-21T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T20:00:00.000Z"),
          endTime: new Date("2026-04-21T21:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "appointment",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T22:00:00.000Z"),
          endTime: new Date("2026-04-21T23:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T00:00:00.000Z"),
          endTime: new Date("2026-04-22T01:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "admin",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T17:00:00.000Z"),
          endTime: new Date("2026-04-22T18:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T23:30:00.000Z"),
          endTime: new Date("2026-04-23T00:30:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T17:00:00.000Z"),
          endTime: new Date("2026-04-23T19:30:00.000Z"),
          allDay: false,
          durationMinutes: 150,
          eventType: "deep_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T16:00:00.000Z"),
          endTime: new Date("2026-04-24T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "exercise",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T17:15:00.000Z"),
          endTime: new Date("2026-04-24T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 45,
          eventType: "meal",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    const tuesday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Tuesday");
    const wednesday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Wednesday");
    const thursday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Thursday");
    const friday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Friday");

    expect(tuesday?.operatingMode).toBe("absorb");
    expect(wednesday?.operatingMode).toBe("protect");
    expect(thursday?.operatingMode).toBe("build");
    expect(friday?.operatingMode).toBe("recover");
    expect(report.derivedMetrics.dailyLoadScores.every((day) => day.modeActions.length >= 2)).toBe(true);
  });

  it("does not let one tight day define an otherwise moderate week", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T15:30:00.000Z"),
          endTime: new Date("2026-04-22T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T17:15:00.000Z"),
          endTime: new Date("2026-04-22T18:15:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T18:30:00.000Z"),
          endTime: new Date("2026-04-22T20:30:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "deep_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T18:00:00.000Z"),
          endTime: new Date("2026-04-23T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "exercise",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T18:00:00.000Z"),
          endTime: new Date("2026-04-24T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "meal",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(report.derivedMetrics.overallLoadScore).toBeLessThan(83);
    expect(Math.max(...report.derivedMetrics.dailyLoadScores.map((day) => day.score))).toBeGreaterThanOrEqual(30);
    expect(report.derivedMetrics.weeklyLoadDebug.multiDayPatternPenalties).toBeLessThan(5);
  });

  it("treats evaluative weeks as heavier than the same supported week without making the whole week uniformly extreme", () => {
    const baseline = createWeekAnalysisReport(
      structuredSupportedWeek,
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );
    const examWeek = createWeekAnalysisReport(
      [
        ...structuredSupportedWeek,
        {
          startTime: new Date("2026-04-24T21:00:00.000Z"),
          endTime: new Date("2026-04-24T22:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "evaluative",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    const friday = examWeek.derivedMetrics.dailyLoadDebug.find((day) => day.label === "Friday");
    const thursday = examWeek.derivedMetrics.dailyLoadDebug.find((day) => day.label === "Thursday");

    expect(examWeek.derivedMetrics.overallLoadScore).toBeGreaterThan(baseline.derivedMetrics.overallLoadScore);
    expect(examWeek.derivedMetrics.weeklyLoadDebug.evaluativeLoadContribution).toBeGreaterThan(0);
    expect(examWeek.derivedMetrics.weeklyLoadDebug.anticipatoryExamContribution).toBeGreaterThan(0);
    expect(friday?.evaluativeLoadSubtotal ?? 0).toBeGreaterThan(0);
    expect(thursday?.anticipatoryExamPressure ?? 0).toBeGreaterThan(0);
    expect(
      Math.max(...examWeek.derivedMetrics.dailyLoadScores.map((day) => day.score)),
    ).toBeGreaterThan(
      Math.max(...baseline.derivedMetrics.dailyLoadScores.map((day) => day.score)),
    );
  });

  it("treats lightly scheduled days in a coursework-heavy week as more than purely open", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T17:00:00.000Z"),
          endTime: new Date("2026-04-22T18:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T16:00:00.000Z"),
          endTime: new Date("2026-04-24T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T19:00:00.000Z"),
          endTime: new Date("2026-04-25T20:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    const lightlyScheduledAcademicDays = report.derivedMetrics.dailyLoadScores.filter(
      (day) => day.committedHours > 0 && day.committedHours <= 2,
    );

    expect(report.derivedMetrics.latentDemandMinutes).toBeGreaterThan(0);
    expect(report.derivedMetrics.overallLoadScore).toBeGreaterThanOrEqual(
      report.derivedMetrics.scheduledLoadScore,
    );
    expect(lightlyScheduledAcademicDays.some((day) => day.score >= 25)).toBe(true);
  });

  it("keeps a true recovery day lighter than a day carrying latent study pressure", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T17:00:00.000Z"),
          endTime: new Date("2026-04-22T18:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T16:00:00.000Z"),
          endTime: new Date("2026-04-25T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "exercise",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T17:15:00.000Z"),
          endTime: new Date("2026-04-25T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 45,
          eventType: "meal",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T18:30:00.000Z"),
          endTime: new Date("2026-04-25T19:30:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile({
        socialRecoveryValue: 4,
        exerciseRecoveryValue: 5,
        quietRecoveryValue: 4,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    const wednesday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Wednesday");
    const saturday = report.derivedMetrics.dailyLoadScores.find((day) => day.label === "Saturday");

    expect(wednesday?.score).toBeGreaterThan(saturday?.score ?? 0);
  });

  it("does not systematically reward under-specified calendars over explicit study planning", () => {
    const underSpecified = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T16:00:00.000Z"),
          endTime: new Date("2026-04-22T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T16:00:00.000Z"),
          endTime: new Date("2026-04-24T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T18:00:00.000Z"),
          endTime: new Date("2026-04-25T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    const explicit = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T16:00:00.000Z"),
          endTime: new Date("2026-04-22T18:00:00.000Z"),
          allDay: false,
          durationMinutes: 120,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-23T17:00:00.000Z"),
          endTime: new Date("2026-04-23T18:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "study_work",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-24T16:00:00.000Z"),
          endTime: new Date("2026-04-24T17:30:00.000Z"),
          allDay: false,
          durationMinutes: 90,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-25T18:00:00.000Z"),
          endTime: new Date("2026-04-25T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(underSpecified.derivedMetrics.overallLoadScore).toBeGreaterThanOrEqual(
      explicit.derivedMetrics.overallLoadScore - 8,
    );
    expect(underSpecified.derivedMetrics.latentDemandMinutes).toBeGreaterThan(0);
  });

  it("does not double-count overlapping committed time", () => {
    const overlappingWeek = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "class",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "high",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(overlappingWeek.derivedMetrics.totalCommittedMinutes).toBe(60);
    expect(overlappingWeek.derivedMetrics.totalCommittedMinutes).toBeLessThanOrEqual(168 * 60);
  });

  it("handles empty weeks gracefully", () => {
    const report = createWeekAnalysisReport([], makeProfile(), new Date("2026-04-20T08:00:00.000Z"));

    expect(report.observations).toHaveLength(3);
    expect(report.suggestions).toHaveLength(2);
    expect(report.observations[0]).toContain("lightly scheduled");
    expect(report.expiresAt.toISOString()).toBe("2026-04-21T08:00:00.000Z");
    expect(report.classifiedEvents).toEqual([]);
    expect(report.derivedMetrics.weekShapeDays).toHaveLength(7);
    expect(report.derivedMetrics.dailyLoadScores).toHaveLength(7);
    expect(report.derivedMetrics.overallLoadScore).toBeGreaterThanOrEqual(0);
  });

  it("never renders 100 even for an extreme high-strain week", () => {
    const busyBaseline = createWeekAnalysisReport(
      busyWeek,
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );
    const report = createWeekAnalysisReport(
      extremeWeek,
      makeProfile({
        overloadSensitivity: 5,
        fragmentationCost: 5,
        transitionCost: 5,
        socialRecoveryValue: 1,
        quietRecoveryValue: 5,
        overcommitmentRisk: 5,
      }),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(report.derivedMetrics.overallLoadScore).toBeGreaterThanOrEqual(0);
    expect(report.derivedMetrics.overallLoadScore).toBeLessThanOrEqual(99);
    expect(report.derivedMetrics.overallLoadScore).toBeGreaterThan(busyBaseline.derivedMetrics.overallLoadScore);
    expect(report.derivedMetrics.dailyLoadScores.every((day) => day.score <= 99)).toBe(true);
    expect(
      Math.max(...report.derivedMetrics.dailyLoadScores.map((day) => day.score)),
    ).toBeGreaterThan(
      Math.max(...busyBaseline.derivedMetrics.dailyLoadScores.map((day) => day.score)),
    );
  });

  it("handles weeks with only unknown categorized events without NaN totals", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "unknown",
          confidence: "low",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(report.derivedMetrics.totalCommittedMinutes).toBe(60);
    expect(report.derivedMetrics.workClassMinutes).toBe(0);
    expect(report.derivedMetrics.meetingsStructuredMinutes).toBe(0);
    expect(report.derivedMetrics.socialMinutes).toBe(0);
    expect(report.derivedMetrics.recoverySoloMinutes).toBe(0);
  });

  it("handles weeks with partial category coverage without NaN totals", () => {
    const report = createWeekAnalysisReport(
      [
        {
          startTime: new Date("2026-04-21T16:00:00.000Z"),
          endTime: new Date("2026-04-21T17:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "work_meeting",
          confidence: "medium",
          classificationSource: "keyword_rule",
        },
        {
          startTime: new Date("2026-04-22T18:00:00.000Z"),
          endTime: new Date("2026-04-22T19:00:00.000Z"),
          allDay: false,
          durationMinutes: 60,
          eventType: "social",
          confidence: "medium",
          classificationSource: "keyword_rule",
        },
      ],
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(report.derivedMetrics.totalCommittedMinutes).toBe(120);
    expect(report.derivedMetrics.workClassMinutes).toBe(0);
    expect(report.derivedMetrics.meetingsStructuredMinutes).toBe(60);
    expect(report.derivedMetrics.socialMinutes).toBe(60);
    expect(report.derivedMetrics.recoverySoloMinutes).toBe(0);
  });
});

describe("normalizeWeekAnalysisMetrics", () => {
  it("returns numeric defaults for an empty metrics payload", () => {
    expect(normalizeWeekAnalysisMetrics(null)).toMatchObject({
      totalCommittedMinutes: 0,
      totalOpenMinutes: 0,
      overallLoadScore: 0,
      scheduledLoadScore: 0,
      latentDemandMinutes: 0,
      availableMarginMinutes: 0,
      workClassMinutes: 0,
      meetingsStructuredMinutes: 0,
      socialMinutes: 0,
      recoverySoloMinutes: 0,
      committedHoursByDay: [],
      dailyLoadScores: [],
      dailyLoadDebug: [],
      freeBlocksByDay: [],
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
    });
  });

  it("fills missing numeric fields on partial persisted metrics", () => {
    const normalized = normalizeWeekAnalysisMetrics({
      committedHoursByDay: [{ label: "Monday", committedHours: 3.5 }],
      totalCommittedMinutes: 210,
      weekShapeDays: [],
    });

    expect(normalized.totalCommittedMinutes).toBe(210);
    expect(normalized.totalOpenMinutes).toBe(0);
    expect(normalized.overallLoadScore).toBe(0);
    expect(normalized.scheduledLoadScore).toBe(0);
    expect(normalized.latentDemandMinutes).toBe(0);
    expect(normalized.availableMarginMinutes).toBe(0);
    expect(normalized.workClassMinutes).toBe(0);
    expect(normalized.socialMinutes).toBe(0);
    expect(normalized.committedHoursByDay[0]?.committedHours).toBe(3.5);
  });

  it("converts invalid numeric values to zero instead of NaN", () => {
    const normalized = normalizeWeekAnalysisMetrics({
      totalCommittedMinutes: Number.NaN,
      totalOpenMinutes: undefined,
      overallLoadScore: Number.NaN,
      scheduledLoadScore: Number.NaN,
      latentDemandMinutes: Number.NaN,
      availableMarginMinutes: Number.NaN,
      workClassMinutes: Number.POSITIVE_INFINITY,
      meetingsStructuredMinutes: -0,
      socialMinutes: Number.NaN,
      recoverySoloMinutes: Number.NaN,
      committedHoursByDay: [{ label: "Tuesday", committedHours: Number.NaN }],
      dailyLoadScores: [{ label: "Tuesday", date: "2026-04-22T00:00:00.000Z", score: Number.NaN, committedHours: Number.NaN }],
    } as any);

    expect(normalized.totalCommittedMinutes).toBe(0);
    expect(normalized.totalOpenMinutes).toBe(0);
    expect(normalized.overallLoadScore).toBe(0);
    expect(normalized.scheduledLoadScore).toBe(0);
    expect(normalized.latentDemandMinutes).toBe(0);
    expect(normalized.availableMarginMinutes).toBe(0);
    expect(normalized.workClassMinutes).toBe(0);
    expect(normalized.socialMinutes).toBe(0);
    expect(normalized.recoverySoloMinutes).toBe(0);
    expect(normalized.committedHoursByDay[0]?.committedHours).toBe(0);
    expect(normalized.dailyLoadScores[0]?.score).toBe(0);
    expect(normalized.dailyLoadScores[0]?.committedHours).toBe(0);
  });

  it("does not rescale already-persisted display scores on read", () => {
    const normalized = normalizeWeekAnalysisMetrics({
      overallLoadScore: 66,
      scheduledLoadScore: 54,
      latentDemandMinutes: 90,
      availableMarginMinutes: 240,
      dailyLoadScores: [
        { label: "Monday", date: "2026-04-21T00:00:00.000Z", score: 31, committedHours: 4 },
        { label: "Tuesday", date: "2026-04-22T00:00:00.000Z", score: 52, committedHours: 5 },
      ],
      dailyLoadDebug: [
        {
          label: "Monday",
          date: "2026-04-21T00:00:00.000Z",
          demandSubtotal: 6,
          evaluativeLoadSubtotal: 0,
          latentDemandSubtotal: 1.2,
          anticipatoryExamPressure: 0,
          supportSubtotal: 2,
          transitionPenalty: 1,
          fragmentationPenalty: 1,
          compressionPenalty: 0.5,
          openTimeSupport: 1,
          accumulationCarryover: 0,
          rawScoreBeforeScaling: 5.5,
          finalDisplayScore: 31,
        },
      ],
      weeklyLoadDebug: {
        scheduledWeeklyRawScoreBeforeLatent: 39,
        evaluativeLoadContribution: 0,
        anticipatoryExamContribution: 0,
        latentDemandContribution: 5,
        summedDailyRawScore: 44,
        averageDailyRawScore: 6.3,
        multiDayPatternPenalties: 4,
        weeklyAggregationPenalty: 1.2,
        recoveryCredits: 2,
        weeklyStabilizingCredits: 2,
        supportFactor: 0.9,
        weeklyRawScoreBeforeScaling: 47,
        finalWeeklyDisplayScore: 66,
      },
    } as any);

    expect(normalized.overallLoadScore).toBe(66);
    expect(normalized.scheduledLoadScore).toBe(54);
    expect(normalized.latentDemandMinutes).toBe(90);
    expect(normalized.availableMarginMinutes).toBe(240);
    expect(normalized.dailyLoadScores.map((day) => day.score)).toEqual([31, 52]);
    expect(normalized.dailyLoadDebug[0]?.finalDisplayScore).toBe(31);
    expect(normalized.weeklyLoadDebug.finalWeeklyDisplayScore).toBe(66);
  });
});

describe("buildWeekAnalysisRecordData", () => {
  it("keeps only classified events and derived report fields in the cache payload", () => {
    const report = createWeekAnalysisReport(
      busyWeek,
      makeProfile(),
      new Date("2026-04-20T08:00:00.000Z"),
    );

    expect(buildWeekAnalysisRecordData("user-1", report)).toMatchObject({
      userId: "user-1",
      analyzedAt: report.analyzedAt,
      expiresAt: report.expiresAt,
      observations: report.observations,
      suggestions: report.suggestions,
      classifiedEvents: expect.any(Array),
      derivedMetrics: expect.any(Object),
    });
    expect(JSON.stringify(buildWeekAnalysisRecordData("user-1", report))).not.toContain("rawTitle");
    expect(buildWeekAnalysisRecordData("user-1", report)).toMatchObject({
      derivedMetrics: expect.objectContaining({
        totalCommittedMinutes: expect.any(Number),
        totalOpenMinutes: expect.any(Number),
        workClassMinutes: expect.any(Number),
        meetingsStructuredMinutes: expect.any(Number),
        socialMinutes: expect.any(Number),
        recoverySoloMinutes: expect.any(Number),
      }),
    });
  });
});
