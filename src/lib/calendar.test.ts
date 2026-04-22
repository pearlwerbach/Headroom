import { describe, expect, it } from "vitest";
import {
  getDashboardEventInterpretation,
  getEffectiveEventType,
  inferEventType,
} from "@/lib/calendar";

describe("inferEventType", () => {
  it("marks class-like events as demand", () => {
    expect(inferEventType("Research Methods Class")).toBe("demand");
  });

  it("treats workouts as recovery when exercise is restorative", () => {
    expect(
      inferEventType("Morning Gym", {
        exerciseRecoveryValue: 5,
        socialRecoveryValue: 3,
        overloadSensitivity: 3,
      }),
    ).toBe("recovery");
  });

  it("downgrades social events to mixed when social load is costly", () => {
    expect(
      inferEventType("Dinner with friends", {
        exerciseRecoveryValue: 3,
        socialRecoveryValue: 3,
        overloadSensitivity: 5,
      }),
    ).toBe("mixed");
  });
});

describe("getEffectiveEventType", () => {
  it("prefers the user override over the inferred type", () => {
    expect(
      getEffectiveEventType({
        title: "Dinner with friends",
        inferredType: "demand",
        userOverrideType: "recovery",
      }),
    ).toBe("recovery");
  });

  it("uses live profile inference before stored inferred type", () => {
    const interpretation = getDashboardEventInterpretation(
      {
        title: "Quiet reading block",
        inferredType: "neutral",
      },
      {
        quietRecoveryValue: 5,
        preferredRecoveryModes: ["quiet"],
      },
    );

    expect(interpretation.type).toBe("recovery");
    expect(interpretation.source).toBe("live_profile_inference");
  });

  it("falls back to the stored inferred type when the live profile cannot classify the event", () => {
    const interpretation = getDashboardEventInterpretation(
      {
        title: "Project sync artifact",
        inferredType: "mixed",
      },
      {
        quietRecoveryValue: 2,
        preferredRecoveryModes: ["quiet"],
      },
    );

    expect(interpretation.type).toBe("mixed");
    expect(interpretation.source).toBe("stored_inferred_type");
  });
});
