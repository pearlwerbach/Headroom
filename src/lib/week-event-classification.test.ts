import { describe, expect, it } from "vitest";
import { classifyWeekEventTitle } from "@/lib/week-event-classification";

describe("classifyWeekEventTitle", () => {
  it("handles phrase disambiguation conservatively", () => {
    expect(classifyWeekEventTitle("Lunch with Alex")).toMatchObject({
      eventType: "social",
      confidence: "high",
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

  it("prefers unknown over weak guesses", () => {
    expect(classifyWeekEventTitle("Block")).toMatchObject({
      eventType: "unknown",
      confidence: "low",
    });
  });
});
