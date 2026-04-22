import { describe, expect, it } from "vitest";
import { QUIZ_VERSION, PROFILE_MODEL_VERSION } from "@/lib/constants";
import { quizQuestions, scoreQuizAnswers } from "@/lib/onboarding";

describe("scoreQuizAnswers", () => {
  it("returns persisted v1 profile fields including raw answers and compatibility projection", () => {
    const answers = Object.fromEntries(
      quizQuestions.map((question) => [question.id, question.options[0]?.value ?? "A"]),
    );

    const profile = scoreQuizAnswers(answers);

    expect(profile.rawAnswers).toEqual({
      q1: "A",
      q2: "A",
      q3: "A",
      q4: "A",
      q5: "A",
      q6: "A",
      q7: "A",
      q8: "A",
      q9: "A",
      q10: "A",
    });
    expect(profile.modelVersion).toBe(PROFILE_MODEL_VERSION);
    expect(profile.quizVersion).toBe(QUIZ_VERSION);
    expect(profile.deepWorkPreference).toBe(profile.blockNeed);
    expect(profile.fragmentationSensitivity).toBe(profile.fragmentationCost);
    expect(profile.socialLoadCost).toBe(profile.socialSpillover);
    expect(profile.ambiguityFriction).toBe(profile.setupLoad);
    expect(profile.exerciseRecoveryBenefit).toBe(profile.physicalReset);
    expect(profile.socialRecoveryBenefit).toBe(profile.socialReset);
    expect(profile.overcommitmentRisk).toBeTypeOf("number");
    expect(profile.subtypeDescription).toBeTypeOf("string");
    expect(profile.shortSummary).toBeTypeOf("string");
    expect(profile.overloadSensitivity).toBeTypeOf("number");
    expect(profile.transitionCost).toBeTypeOf("number");
    expect(profile.deepWorkCapacity).toBe(profile.blockNeed);
    expect(profile.ambiguityTolerance).toBeTypeOf("number");
    expect(profile.routinePreference).toBeTypeOf("number");
    expect(profile.socialRecoveryValue).toBe(profile.socialReset);
    expect(profile.exerciseRecoveryValue).toBe(profile.physicalReset);
    expect(profile.quietRecoveryValue).toBe(profile.passiveReset);
    expect(Array.isArray(profile.preferredRecoveryModes)).toBe(true);
  });

  it("produces materially different saved raw answers, canonical variables, and subtype names for contrasting answer sets", () => {
    const lowFrictionAnswers = {
      q1: "A",
      q2: "A",
      q3: "A",
      q4: "A",
      q5: "A",
      q6: "A",
      q7: "A",
      q8: "A",
      q9: "A",
      q10: "A",
    };
    const highStructureAnswers = {
      q1: "C",
      q2: "D",
      q3: "D",
      q4: "D",
      q5: "D",
      q6: "C",
      q7: "D",
      q8: "A",
      q9: "D",
      q10: "D",
    };

    const lowFrictionProfile = scoreQuizAnswers(lowFrictionAnswers);
    const highStructureProfile = scoreQuizAnswers(highStructureAnswers);

    expect(lowFrictionProfile.rawAnswers).not.toEqual(highStructureProfile.rawAnswers);
    expect(lowFrictionProfile.subtypeName).not.toBe(highStructureProfile.subtypeName);
    expect(lowFrictionProfile.fragmentationCost).not.toBe(highStructureProfile.fragmentationCost);
    expect(lowFrictionProfile.transitionCost).not.toBe(highStructureProfile.transitionCost);
    expect(lowFrictionProfile.deepWorkCapacity).not.toBe(highStructureProfile.deepWorkCapacity);
    expect(lowFrictionProfile.ambiguityTolerance).not.toBe(highStructureProfile.ambiguityTolerance);
    expect(lowFrictionProfile.overloadSensitivity).not.toBe(
      highStructureProfile.overloadSensitivity,
    );
    expect(lowFrictionProfile.preferredRecoveryModes).not.toEqual(
      highStructureProfile.preferredRecoveryModes,
    );
  });
});
