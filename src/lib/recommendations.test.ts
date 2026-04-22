import { addDays, addHours, startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";
import { buildWeeklyLoadMetrics, generateRecommendationDrafts } from "@/lib/recommendations";
import type {
  CalendarEventSnapshot,
  CognitiveProfileSnapshot,
  TaskSnapshot,
} from "@/lib/domain";

function makeProfile(): CognitiveProfileSnapshot {
  return {
    subtypeName: "Protected-Block Planner",
    subtypeDescription: "Needs a protected structure for demanding work.",
    shortSummary: "Protected time matters more than nominal open time.",
    overloadSensitivity: 4,
    fragmentationCost: 4,
    transitionCost: 4,
    deepWorkCapacity: 4,
    ambiguityTolerance: 2,
    routinePreference: 4,
    socialRecoveryValue: 3,
    exerciseRecoveryValue: 5,
    quietRecoveryValue: 3,
    overcommitmentRisk: 4,
    preferredRecoveryModes: ["exercise", "social", "quiet"],
  };
}

function makeFlexibleProfile(): CognitiveProfileSnapshot {
  return {
    ...makeProfile(),
    subtypeName: "Adaptive Generalist",
    subtypeDescription: "Can adapt across a wider range of weekly structures.",
    shortSummary: "Smaller windows remain more usable across the week.",
    fragmentationCost: 1,
    transitionCost: 1,
    quietRecoveryValue: 5,
    exerciseRecoveryValue: 2,
    preferredRecoveryModes: ["quiet", "exercise", "social"],
  };
}

function makeEvents(now: Date): CalendarEventSnapshot[] {
  const day = startOfDay(now);

  return [
    {
      id: "event-1",
      title: "Stats class",
      startTime: addHours(addDays(day, 1), 10),
      endTime: addHours(addDays(day, 1), 11),
      allDay: false,
      inferredType: "demand",
    },
    {
      id: "event-2",
      title: "Gym",
      startTime: addHours(addDays(day, 1), 17),
      endTime: addHours(addDays(day, 1), 18),
      allDay: false,
      inferredType: "recovery",
    },
    {
      id: "event-3",
      title: "Quiet reading block",
      startTime: addHours(addDays(day, 2), 18),
      endTime: addHours(addDays(day, 2), 19),
      allDay: false,
      inferredType: "neutral",
    },
    {
      id: "event-4",
      title: "Team check-in",
      startTime: addHours(addDays(day, 2), 9),
      endTime: addHours(addDays(day, 2), 10),
      allDay: false,
      inferredType: "demand",
    },
    {
      id: "event-5",
      title: "Office hours",
      startTime: addHours(addDays(day, 2), 11),
      endTime: addHours(addDays(day, 2), 12),
      allDay: false,
      inferredType: "demand",
    },
  ];
}

function makeTasks(now: Date): TaskSnapshot[] {
  return [
    {
      id: "task-1",
      title: "Lab report draft",
      dueAt: addDays(now, 2),
      estimatedHours: 4,
      taskType: "writing",
      requiresUninterruptedBlock: true,
      status: "active",
      ambiguityLevel: 4,
      emotionalFriction: 3,
    },
    {
      id: "task-2",
      title: "Send internship emails",
      dueAt: addDays(now, 1),
      estimatedHours: 0.5,
      taskType: "admin",
      requiresUninterruptedBlock: false,
      status: "active",
    },
  ];
}

describe("recommendation engine", () => {
  it("detects windows and produces ranked recommendations", () => {
    const now = new Date("2026-04-17T09:00:00");
    const result = generateRecommendationDrafts(makeEvents(now), makeTasks(now), makeProfile(), now);

    expect(result.windows.length).toBeGreaterThan(0);
    expect(result.drafts.some((draft) => draft.recommendationType === "start_early")).toBe(true);
  });

  it("reports a deep-work mismatch when heavy tasks exceed deep windows", () => {
    const now = new Date("2026-04-17T09:00:00");
    const day = startOfDay(now);
    const fragmentedWeekEvents: CalendarEventSnapshot[] = Array.from({ length: 7 }).flatMap(
      (_, index) =>
        [8, 10, 12, 14, 16, 18].map((hour, eventIndex) => ({
          id: `dense-${index}-${eventIndex}`,
          title: "Dense schedule block",
          startTime: addHours(addDays(day, index), hour),
          endTime: addHours(addDays(day, index), hour + 1),
          allDay: false,
          inferredType: "demand" as const,
        })),
    );
    const metrics = buildWeeklyLoadMetrics(
      fragmentedWeekEvents,
      [
        {
          ...makeTasks(now)[0],
          estimatedHours: 40,
        },
      ],
      makeProfile(),
      now,
    );

    expect(metrics.metrics.deepWorkMismatch).toBe(true);
  });

  it("changes load score, highlighted risks, and recommendation summaries when the profile changes materially", () => {
    const now = new Date("2026-04-17T09:00:00");
    const events = makeEvents(now);
    const tasks = makeTasks(now);

    const structured = generateRecommendationDrafts(events, tasks, makeProfile(), now);
    const flexible = generateRecommendationDrafts(events, tasks, makeFlexibleProfile(), now);

    expect(structured.metrics.overloadRiskScore).not.toBe(flexible.metrics.overloadRiskScore);
    expect(structured.metrics.highlightedRisks).not.toEqual(flexible.metrics.highlightedRisks);
    expect(structured.drafts.map((draft) => draft.summary)).not.toEqual(
      flexible.drafts.map((draft) => draft.summary),
    );
  });
});
