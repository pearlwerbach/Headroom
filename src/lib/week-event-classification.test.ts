import { describe, expect, it } from "vitest";
import {
  buildCanonicalClassifiedWeekEvent,
  classifyWeekEvent,
  classifyWeekEventTitle,
  resolveCompositionCategory,
  resolveRecoveryCategory,
} from "@/lib/week-event-classification";

describe("classifyWeekEventTitle", () => {
  it("handles phrase disambiguation conservatively", () => {
    expect(classifyWeekEventTitle("Lunch with Alex")).toMatchObject({
      eventType: "meal",
      confidence: "medium",
      classificationSource: "keyword_rule",
    });
    expect(classifyWeekEventTitle("Lunch")).toMatchObject({
      eventType: "meal",
      confidence: "medium",
    });
    expect(classifyWeekEventTitle("Planning")).toMatchObject({
      eventType: "admin",
    });
    expect(classifyWeekEventTitle("Project planning meeting")).toMatchObject({
      eventType: "work_meeting",
      confidence: "high",
    });
    expect(classifyWeekEventTitle("Homework review")).toMatchObject({
      eventType: "study_work",
      confidence: "medium",
    });
    expect(classifyWeekEventTitle("Submit readings")).toMatchObject({
      eventType: "study_work",
      confidence: "medium",
    });
    expect(classifyWeekEventTitle("Physics midterm")).toMatchObject({
      eventType: "evaluative",
      confidence: "medium",
    });
    expect(classifyWeekEventTitle("Final exam")).toMatchObject({
      eventType: "evaluative",
      confidence: "high",
    });
  });

  it("broadly captures recovery-support events", () => {
    expect(classifyWeekEventTitle("Lunch break")).toMatchObject({
      eventType: "meal",
    });
    expect(classifyWeekEventTitle("din din")).toMatchObject({
      eventType: "meal",
    });
    expect(classifyWeekEventTitle("quick brekky at home")).toMatchObject({
      eventType: "meal",
    });
    expect(classifyWeekEventTitle("Grab dinner")).toMatchObject({
      eventType: "meal",
    });
    expect(classifyWeekEventTitle("Wrist PT")).toMatchObject({
      eventType: "personal_care",
    });
    expect(classifyWeekEventTitle("Shower + skincare")).toMatchObject({
      eventType: "personal_care",
    });
    expect(classifyWeekEventTitle("Pharmacy")).toMatchObject({
      eventType: "errand",
    });
    expect(classifyWeekEventTitle("Walk")).toMatchObject({
      eventType: "exercise",
    });
    expect(classifyWeekEventTitle("Volume Day Climb")).toMatchObject({
      eventType: "exercise",
    });
    expect(classifyWeekEventTitle("Legs")).toMatchObject({
      eventType: "exercise",
    });
    expect(classifyWeekEventTitle("Cal Climbing Practice")).toMatchObject({
      eventType: "exercise",
    });
    expect(classifyWeekEventTitle("Upper Body + Core")).toMatchObject({
      eventType: "exercise",
    });
    expect(classifyWeekEventTitle("Nap")).toMatchObject({
      eventType: "rest",
    });
    expect(classifyWeekEventTitle("Saisha and me adventure")).toMatchObject({
      eventType: "social",
    });
    expect(classifyWeekEventTitle("Eran board game wine night")).toMatchObject({
      eventType: "social",
    });
    expect(classifyWeekEventTitle("WITH SHERI Concert at the Castle")).toMatchObject({
      eventType: "social",
    });
    expect(classifyWeekEventTitle("chelsea bday")).toMatchObject({
      eventType: "social",
    });
    expect(classifyWeekEventTitle("do physics")).toMatchObject({
      eventType: "class",
    });
    expect(classifyWeekEventTitle("physicsss")).toMatchObject({
      eventType: "class",
    });
    expect(classifyWeekEventTitle("Physics ohs")).toMatchObject({
      eventType: "class",
    });
    expect(classifyWeekEventTitle("N-ACT Supervision")).toMatchObject({
      eventType: "work_meeting",
    });
    expect(classifyWeekEventTitle("PsySci Team Meet")).toMatchObject({
      eventType: "class",
    });
    expect(classifyWeekEventTitle("Benchmark practices")).toMatchObject({
      eventType: "work_meeting",
    });
  });

  it("uses description matching when the title is too thin", () => {
    expect(
      classifyWeekEvent({
        title: "Block",
        description: "Lunch with friends after class",
      }),
    ).toMatchObject({
      eventType: "meal",
      matchedRule: "meal_keyword",
    });
  });

  it("resolves composition and recovery categories consistently", () => {
    expect(resolveCompositionCategory("class")).toBe("work_class");
    expect(resolveCompositionCategory("work_meeting")).toBe("meetings_structured");
    expect(resolveCompositionCategory("social")).toBe("social");
    expect(resolveCompositionCategory("meal")).toBe("recovery_solo");
    expect(resolveRecoveryCategory("exercise")).toBe("exercise");
    expect(resolveRecoveryCategory("meal")).toBe("care");
    expect(resolveRecoveryCategory("rest")).toBe("rest");
    expect(resolveRecoveryCategory("class")).toBeNull();
  });

  it("prefers unknown over weak guesses", () => {
    expect(classifyWeekEventTitle("Block")).toMatchObject({
      eventType: "unknown",
      confidence: "low",
    });
  });

  it("does not count all-day task markers as 24 hours of composition time", () => {
    const allDayMarker = buildCanonicalClassifiedWeekEvent({
      title: "Read thru all class notes?",
      startTime: new Date("2026-04-24T00:00:00.000Z"),
      endTime: new Date("2026-04-25T00:00:00.000Z"),
      allDay: true,
      rangeStart: new Date("2026-04-20T00:00:00.000Z"),
      rangeEnd: new Date("2026-04-27T00:00:00.000Z"),
    });

    expect(allDayMarker).toMatchObject({
      eventType: "class",
      isAllDayLike: true,
      countedDurationHours: 0,
      includeInComposition: false,
      includeInTrajectory: true,
    });
  });
});
