import { describe, expect, it } from "vitest";
import {
  assignSubtype,
  buildCognitiveProfileFromScoringState,
  computeCognitiveProfile,
  getLegacyCognitiveProfileFallback,
  getPlanningReadyCognitiveProfile,
} from "@/lib/cognitive-profile";
import type { RawQuizAnswers } from "@/lib/profile-model";

const baselineAnswers: RawQuizAnswers = {
  q1: "B",
  q2: "B",
  q3: "B",
  q4: "B",
  q5: "B",
  q6: "A",
  q7: "B",
  q8: "B",
  q9: "A",
  q10: "A",
};

describe("cognitive profile computation", () => {
  it("computes a canonical cognitive profile from raw quiz answers", () => {
    const computed = computeCognitiveProfile(baselineAnswers);

    expect(computed.profile.subtypeName).toBeTypeOf("string");
    expect(computed.profile.subtypeDescription.length).toBeGreaterThan(0);
    expect(computed.profile.shortSummary.length).toBeGreaterThan(0);
    expect(computed.profile.deepWorkCapacity).toBe(computed.scoringState.blockNeed);
    expect(computed.profile.transitionCost).toBe(computed.scoringState.switchingCost);
    expect(computed.profile.fragmentationCost).toBe(computed.scoringState.fragmentationCost);
    expect(computed.profile.ambiguityTolerance).toBe(6 - computed.scoringState.setupLoad);
    expect(computed.profile.socialRecoveryValue).toBe(computed.scoringState.socialReset);
    expect(computed.profile.exerciseRecoveryValue).toBe(computed.scoringState.physicalReset);
    expect(computed.profile.quietRecoveryValue).toBe(computed.scoringState.passiveReset);
    expect(computed.profile.preferredRecoveryModes).toHaveLength(3);
    expect(computed.dashboardIndicators).toHaveLength(4);
  });

  it("assigns subtype from variable patterns rather than raw answers alone", () => {
    expect(
      assignSubtype({
        overloadSensitivity: 5,
        fragmentationCost: 4,
        transitionCost: 4,
        deepWorkCapacity: 4,
        ambiguityTolerance: 2,
        routinePreference: 5,
        socialRecoveryValue: 3,
        exerciseRecoveryValue: 4,
        quietRecoveryValue: 3,
        overcommitmentRisk: 4,
        preferredRecoveryModes: ["exercise", "social", "quiet"],
      }),
    ).toBe("Protected-Block Planner");
  });

  it("derives recovery preference ordering from the strongest recovery values", () => {
    const profile = buildCognitiveProfileFromScoringState({
      blockNeed: 3,
      fragmentationCost: 3,
      switchingCost: 3,
      setupLoad: 3,
      socialSpillover: 3,
      passiveReset: 2,
      socialReset: 5,
      physicalReset: 4,
      overcommitmentRisk: 3,
    });

    expect(profile.preferredRecoveryModes).toEqual(["social", "exercise", "quiet"]);
  });

  it("does not fabricate a full canonical planning profile from legacy compatibility fields", () => {
    const legacyStoredProfile = {
      deepWorkPreference: 4,
      fragmentationSensitivity: 5,
      socialLoadCost: 3,
      ambiguityFriction: 4,
      exerciseRecoveryBenefit: 5,
      socialRecoveryBenefit: 2,
      subtypeName: "Protected-Block Planner",
      underestimatesOpenEndedWork: true,
    };

    expect(getPlanningReadyCognitiveProfile(legacyStoredProfile)).toBeNull();

    expect(getLegacyCognitiveProfileFallback(legacyStoredProfile)).toEqual({
      subtypeName: "Protected-Block Planner",
      subtypeDescription:
        "This profile was generated before canonical planning variables were stored directly.",
      shortSummary:
        "Retake the assessment to refresh this profile for recommendations and scoring.",
      fragmentationCost: 5,
      deepWorkCapacity: 4,
      ambiguityTolerance: 2,
      socialRecoveryValue: 2,
      exerciseRecoveryValue: 5,
    });
  });
});
