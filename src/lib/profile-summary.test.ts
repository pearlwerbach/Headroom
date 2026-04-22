import { describe, expect, it } from "vitest";
import { PROFILE_MODEL_VERSION } from "@/lib/constants";
import { scoreQuizAnswers } from "@/lib/onboarding";
import { type ProfileSnapshot, getProfileModel } from "@/lib/profile-summary";
import { getSubtypePresentation } from "@/lib/profile-presentation";

function makeExplicitProfile(
  overrides: Partial<ProfileSnapshot> = {},
): ProfileSnapshot {
  return {
    id: "profile-explicit",
    updatedAt: new Date("2026-04-18T12:00:00Z"),
    rawAnswers: {
      q1: "C",
      q2: "D",
      q3: "D",
      q4: "D",
      q5: "B",
      q6: "C",
      q7: "B",
      q8: "A",
      q9: "D",
      q10: "D",
    },
    modelVersion: PROFILE_MODEL_VERSION,
    blockNeed: 5,
    fragmentationCost: 5,
    switchingCost: 5,
    setupLoad: 5,
    socialSpillover: 2,
    passiveReset: 4,
    socialReset: 3,
    physicalReset: 5,
    overcommitmentRisk: 4,
    subtypeName: "Protected-Block Planner",
    subtypeDescription: "Protected time matters more than visible open time.",
    shortSummary: "Structure matters more than total available volume.",
    overloadSensitivity: 4,
    transitionCost: 5,
    deepWorkCapacity: 5,
    ambiguityTolerance: 1,
    routinePreference: 5,
    socialRecoveryValue: 3,
    exerciseRecoveryValue: 5,
    quietRecoveryValue: 4,
    preferredRecoveryModes: ["exercise", "quiet", "social"],
    riskFlags: [
      "False Free Time Risk",
      "Setup Trap Risk",
      "Mode-Switching Risk",
      "Overcommitment Risk Flag",
    ],
    deepWorkPreference: 5,
    fragmentationSensitivity: 5,
    socialLoadCost: 2,
    ambiguityFriction: 5,
    exerciseRecoveryBenefit: 5,
    socialRecoveryBenefit: 3,
    prefersLongBlocks: true,
    underestimatesOpenEndedWork: true,
    ...overrides,
  };
}

function makeLegacyProfile(
  overrides: Partial<ProfileSnapshot> = {},
): ProfileSnapshot {
  return {
    id: "profile-legacy",
    updatedAt: new Date("2026-04-18T08:00:00Z"),
    rawAnswers: null,
    modelVersion: null,
    blockNeed: null,
    fragmentationCost: null,
    switchingCost: null,
    setupLoad: null,
    socialSpillover: null,
    passiveReset: null,
    socialReset: null,
    physicalReset: null,
    overcommitmentRisk: null,
    subtypeName: null,
    subtypeDescription: null,
    shortSummary: null,
    overloadSensitivity: null,
    transitionCost: null,
    deepWorkCapacity: null,
    ambiguityTolerance: null,
    routinePreference: null,
    socialRecoveryValue: null,
    exerciseRecoveryValue: null,
    quietRecoveryValue: null,
    preferredRecoveryModes: [],
    riskFlags: [],
    deepWorkPreference: 2,
    fragmentationSensitivity: 2,
    socialLoadCost: 3,
    ambiguityFriction: 3,
    exerciseRecoveryBenefit: 4,
    socialRecoveryBenefit: 3,
    prefersLongBlocks: false,
    underestimatesOpenEndedWork: false,
    ...overrides,
  };
}

describe("profile summary model", () => {
  it("uses the fixed subtype presentation copy for canonical profiles", () => {
    const model = getProfileModel(makeExplicitProfile());
    const presentation = getSubtypePresentation("Protected-Block Planner");

    expect(model.profileName).toBe("Protected-Block Planner");
    expect(model.description).toBe(presentation.description);
    expect(model.whatThisMeans).toBe(presentation.corePattern);
    expect(model.debug.isLegacy).toBe(false);
    expect(model.debug.rawAnswers?.q1).toBe("C");
  });

  it("still produces a readable fallback model for legacy profiles", () => {
    const model = getProfileModel(makeLegacyProfile());

    expect(model.debug.isLegacy).toBe(true);
    expect(model.debug.legacyMessage).toMatch(/retake quiz/i);
    expect(model.profileName.length).toBeGreaterThan(0);
    expect(model.signals).toHaveLength(4);
  });

  it("shows visibly different supporting-signal bars for materially different saved profiles", () => {
    const lowFrictionProfile = scoreQuizAnswers({
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
    const highStructureProfile = scoreQuizAnswers({
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
    });

    const lowFrictionModel = getProfileModel({
      id: "profile-low-friction",
      updatedAt: new Date("2026-04-18T09:00:00Z"),
      ...lowFrictionProfile,
    });
    const highStructureModel = getProfileModel({
      id: "profile-high-structure",
      updatedAt: new Date("2026-04-18T10:00:00Z"),
      ...highStructureProfile,
    });

    expect(lowFrictionModel.profileName).not.toBe(highStructureModel.profileName);
    expect(lowFrictionModel.signals).toHaveLength(4);
    expect(highStructureModel.signals).toHaveLength(4);
    expect(lowFrictionModel.signals).not.toEqual(highStructureModel.signals);
    expect(
      lowFrictionModel.signals.some(
        (signal, index) => signal.value !== highStructureModel.signals[index]?.value,
      ),
    ).toBe(true);
    expect(lowFrictionModel.profileName).toBe(lowFrictionProfile.subtypeName);
    expect(highStructureModel.profileName).toBe(highStructureProfile.subtypeName);
    expect(lowFrictionModel.debug.renderSource).toBe("canonical_profile");
    expect(highStructureModel.debug.renderSource).toBe("canonical_profile");
  });

  it("uses level-responsive signal interpretation lines while keeping signal labels fixed", () => {
    const lowFrictionModel = getProfileModel({
      id: "profile-low-friction",
      updatedAt: new Date("2026-04-18T09:00:00Z"),
      ...scoreQuizAnswers({
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
      }),
    });
    const highStructureModel = getProfileModel({
      id: "profile-high-structure",
      updatedAt: new Date("2026-04-18T10:00:00Z"),
      ...scoreQuizAnswers({
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
      }),
    });

    const lowFragmentationSignal = lowFrictionModel.signals.find(
      (signal) => signal.key === "fragmentation_cost",
    );
    const highFragmentationSignal = highStructureModel.signals.find(
      (signal) => signal.key === "fragmentation_cost",
    );

    expect(lowFragmentationSignal?.label).toBe("Fragmentation Cost");
    expect(highFragmentationSignal?.label).toBe("Fragmentation Cost");
    expect(lowFragmentationSignal?.value).toBe("Low");
    expect(highFragmentationSignal?.value).toBe("High");
    expect(lowFragmentationSignal?.definition).toBe(
      "Short gaps reduce usable work capacity",
    );
    expect(highFragmentationSignal?.definition).toBe(
      "Short gaps reduce usable work capacity",
    );
    expect(lowFragmentationSignal?.description).not.toBe(
      highFragmentationSignal?.description,
    );
  });
});
