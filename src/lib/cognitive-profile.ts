import type { RawQuizAnswers, SubtypeName, LatentVariables } from "@/lib/profile-model";
import { getSubtypePresentation } from "@/lib/profile-presentation";
import { scoreExplicitProfile } from "@/lib/profile-model";
import { clamp } from "@/lib/utils";

export const RECOVERY_MODES = ["social", "exercise", "quiet"] as const;

export type RecoveryMode = (typeof RECOVERY_MODES)[number];

export interface DashboardIndicator {
  key:
    | "overloadSensitivity"
    | "fragmentationCost"
    | "transitionCost"
    | "deepWorkCapacity";
  label: string;
  value: number;
}

export interface CognitiveProfile {
  subtypeName: SubtypeName;
  subtypeDescription: string;
  shortSummary: string;
  overloadSensitivity: number;
  fragmentationCost: number;
  transitionCost: number;
  deepWorkCapacity: number;
  ambiguityTolerance: number;
  routinePreference: number;
  socialRecoveryValue: number;
  exerciseRecoveryValue: number;
  quietRecoveryValue: number;
  overcommitmentRisk: number;
  preferredRecoveryModes: RecoveryMode[];
}

export interface ComputedCognitiveProfile {
  scoringState: LatentVariables;
  profile: CognitiveProfile;
  subtypeName: SubtypeName;
  subtypeDescription: string;
  shortSummary: string;
  topRecoveryModes: RecoveryMode[];
  dashboardIndicators: DashboardIndicator[];
}

export interface LegacyCognitiveProfileFallback {
  subtypeName?: SubtypeName;
  subtypeDescription?: string;
  shortSummary?: string;
  fragmentationCost?: number;
  deepWorkCapacity?: number;
  ambiguityTolerance?: number;
  socialRecoveryValue?: number;
  exerciseRecoveryValue?: number;
}

type NumericKey = Exclude<
  keyof CognitiveProfile,
  "subtypeName" | "subtypeDescription" | "shortSummary" | "preferredRecoveryModes"
>;

export type CognitiveProfileSnapshot = CognitiveProfile;

export interface SubtypeDefinition {
  name: SubtypeName;
  description: string;
  summary: string;
  matches: (profile: Omit<CognitiveProfile, "subtypeName" | "subtypeDescription" | "shortSummary">) => boolean;
}

type StoredCognitiveProfileSource = {
  subtypeName?: string | null;
  subtypeDescription?: string | null;
  shortSummary?: string | null;
  overloadSensitivity?: number | null;
  fragmentationCost?: number | null;
  transitionCost?: number | null;
  deepWorkCapacity?: number | null;
  ambiguityTolerance?: number | null;
  routinePreference?: number | null;
  socialRecoveryValue?: number | null;
  exerciseRecoveryValue?: number | null;
  quietRecoveryValue?: number | null;
  overcommitmentRisk?: number | null;
  preferredRecoveryModes?: string[] | null;
  blockNeed?: number | null;
  switchingCost?: number | null;
  setupLoad?: number | null;
  socialSpillover?: number | null;
  passiveReset?: number | null;
  socialReset?: number | null;
  physicalReset?: number | null;
  deepWorkPreference?: number | null;
  fragmentationSensitivity?: number | null;
  socialLoadCost?: number | null;
  ambiguityFriction?: number | null;
  exerciseRecoveryBenefit?: number | null;
  socialRecoveryBenefit?: number | null;
  prefersLongBlocks?: boolean | null;
  underestimatesOpenEndedWork?: boolean | null;
};

const NUMERIC_KEYS: NumericKey[] = [
  "overloadSensitivity",
  "fragmentationCost",
  "transitionCost",
  "deepWorkCapacity",
  "ambiguityTolerance",
  "routinePreference",
  "socialRecoveryValue",
  "exerciseRecoveryValue",
  "quietRecoveryValue",
  "overcommitmentRisk",
];

export const SUBTYPE_DEFINITIONS: SubtypeDefinition[] = [
  {
    name: "Protected-Block Planner",
    description: getSubtypePresentation("Protected-Block Planner").description,
    summary: getSubtypePresentation("Protected-Block Planner").corePattern,
    matches: (profile) =>
      profile.deepWorkCapacity >= 4 &&
      profile.fragmentationCost >= 4 &&
      profile.routinePreference >= 4,
  },
  {
    name: "Reset-Sensitive Scheduler",
    description: getSubtypePresentation("Reset-Sensitive Scheduler").description,
    summary: getSubtypePresentation("Reset-Sensitive Scheduler").corePattern,
    matches: (profile) => {
      const lowRecoveryModes = [
        profile.socialRecoveryValue,
        profile.exerciseRecoveryValue,
        profile.quietRecoveryValue,
      ].filter((value) => value <= 2).length;

      return profile.overloadSensitivity >= 4 && lowRecoveryModes >= 2;
    },
  },
  {
    name: "Context-Sensitive Worker",
    description: getSubtypePresentation("Context-Sensitive Worker").description,
    summary: getSubtypePresentation("Context-Sensitive Worker").corePattern,
    matches: (profile) =>
      profile.transitionCost >= 4 &&
      profile.fragmentationCost >= 3 &&
      profile.overloadSensitivity >= 3,
  },
  {
    name: "Short-Cycle Executor",
    description: getSubtypePresentation("Short-Cycle Executor").description,
    summary: getSubtypePresentation("Short-Cycle Executor").corePattern,
    matches: (profile) =>
      profile.deepWorkCapacity <= 2 &&
      profile.fragmentationCost <= 3 &&
      profile.ambiguityTolerance >= 3,
  },
  {
    name: "Adaptive Generalist",
    description: getSubtypePresentation("Adaptive Generalist").description,
    summary: getSubtypePresentation("Adaptive Generalist").corePattern,
    matches: () => true,
  },
];

function roundToScale(value: number) {
  return clamp(Math.round(value), 1, 5);
}

function getRecoveryWeakness(variables: LatentVariables) {
  const averageRecovery =
    (variables.passiveReset + variables.socialReset + variables.physicalReset) / 3;

  return 6 - averageRecovery;
}

function getRoutinePreference(variables: LatentVariables) {
  return roundToScale(
    (variables.fragmentationCost +
      variables.switchingCost +
      variables.setupLoad +
      variables.blockNeed) /
      4,
  );
}

function getOverloadSensitivity(variables: LatentVariables) {
  return roundToScale(
    (variables.socialSpillover +
      variables.overcommitmentRisk +
      getRecoveryWeakness(variables)) /
      3,
  );
}

function getAmbiguityTolerance(variables: LatentVariables) {
  return clamp(6 - variables.setupLoad, 1, 5);
}

function getPreferredRecoveryModes(
  quietRecoveryValue: number,
  socialRecoveryValue: number,
  exerciseRecoveryValue: number,
): RecoveryMode[] {
  return [
    { mode: "quiet" as const, value: quietRecoveryValue },
    { mode: "social" as const, value: socialRecoveryValue },
    { mode: "exercise" as const, value: exerciseRecoveryValue },
  ]
    .sort((left, right) => right.value - left.value)
    .map((entry) => entry.mode);
}

function getDashboardIndicators(profile: CognitiveProfile): DashboardIndicator[] {
  return [
    {
      key: "overloadSensitivity",
      label: "Overload sensitivity",
      value: profile.overloadSensitivity,
    },
    {
      key: "fragmentationCost",
      label: "Fragmentation cost",
      value: profile.fragmentationCost,
    },
    {
      key: "transitionCost",
      label: "Transition cost",
      value: profile.transitionCost,
    },
    {
      key: "deepWorkCapacity",
      label: "Deep-work capacity",
      value: profile.deepWorkCapacity,
    },
  ];
}

function getSubtypeMetadata(
  profile: Omit<CognitiveProfile, "subtypeName" | "subtypeDescription" | "shortSummary">,
) {
  const definition = SUBTYPE_DEFINITIONS.find((candidate) => candidate.matches(profile));

  return definition ?? SUBTYPE_DEFINITIONS.at(-1)!;
}

export function assignSubtype(
  profile: Omit<CognitiveProfile, "subtypeName" | "subtypeDescription" | "shortSummary">,
) {
  return getSubtypeMetadata(profile).name;
}

export function buildCognitiveProfileFromScoringState(
  variables: LatentVariables,
): CognitiveProfile {
  const quietRecoveryValue = variables.passiveReset;
  const socialRecoveryValue = variables.socialReset;
  const exerciseRecoveryValue = variables.physicalReset;
  const profileWithoutSubtype = {
    overloadSensitivity: getOverloadSensitivity(variables),
    fragmentationCost: variables.fragmentationCost,
    transitionCost: variables.switchingCost,
    deepWorkCapacity: variables.blockNeed,
    ambiguityTolerance: getAmbiguityTolerance(variables),
    routinePreference: getRoutinePreference(variables),
    socialRecoveryValue,
    exerciseRecoveryValue,
    quietRecoveryValue,
    overcommitmentRisk: variables.overcommitmentRisk,
    preferredRecoveryModes: getPreferredRecoveryModes(
      quietRecoveryValue,
      socialRecoveryValue,
      exerciseRecoveryValue,
    ),
  };
  const subtype = getSubtypeMetadata(profileWithoutSubtype);

  return {
    subtypeName: subtype.name,
    subtypeDescription: subtype.description,
    shortSummary: subtype.summary,
    ...profileWithoutSubtype,
  };
}

export function computeCognitiveProfile(
  rawAnswers: RawQuizAnswers,
): ComputedCognitiveProfile {
  const scoredProfile = scoreExplicitProfile(rawAnswers);
  const profile = buildCognitiveProfileFromScoringState(scoredProfile.variables);

  return {
    scoringState: scoredProfile.variables,
    profile,
    subtypeName: profile.subtypeName,
    subtypeDescription: profile.subtypeDescription,
    shortSummary: profile.shortSummary,
    topRecoveryModes: profile.preferredRecoveryModes,
    dashboardIndicators: getDashboardIndicators(profile),
  };
}

function hasStoredCanonicalProfile(profile: StoredCognitiveProfileSource) {
  return NUMERIC_KEYS.every((key) => typeof profile[key] === "number");
}

function hasStoredScoringState(profile: StoredCognitiveProfileSource) {
  return (
    typeof profile.blockNeed === "number" &&
    typeof profile.fragmentationCost === "number" &&
    typeof profile.switchingCost === "number" &&
    typeof profile.setupLoad === "number" &&
    typeof profile.socialSpillover === "number" &&
    typeof profile.passiveReset === "number" &&
    typeof profile.socialReset === "number" &&
    typeof profile.physicalReset === "number" &&
    typeof profile.overcommitmentRisk === "number"
  );
}

function hasLegacyCompatibilityProfile(profile: StoredCognitiveProfileSource) {
  return (
    typeof profile.deepWorkPreference === "number" &&
    typeof profile.fragmentationSensitivity === "number" &&
    typeof profile.socialLoadCost === "number" &&
    typeof profile.ambiguityFriction === "number" &&
    typeof profile.exerciseRecoveryBenefit === "number" &&
    typeof profile.socialRecoveryBenefit === "number"
  );
}

export function getPlanningReadyCognitiveProfile(
  profile: StoredCognitiveProfileSource | null | undefined,
): CognitiveProfileSnapshot | null {
  if (!profile) {
    return null;
  }

  if (hasStoredCanonicalProfile(profile)) {
    const preferredRecoveryModes = Array.isArray(profile.preferredRecoveryModes)
      ? profile.preferredRecoveryModes.filter((value): value is RecoveryMode =>
          RECOVERY_MODES.includes(value as RecoveryMode),
        )
      : [];

    return {
      subtypeName:
        typeof profile.subtypeName === "string"
          ? (profile.subtypeName as SubtypeName)
          : "Adaptive Generalist",
      subtypeDescription: profile.subtypeDescription ?? "",
      shortSummary: profile.shortSummary ?? "",
      overloadSensitivity: profile.overloadSensitivity as number,
      fragmentationCost: profile.fragmentationCost as number,
      transitionCost: profile.transitionCost as number,
      deepWorkCapacity: profile.deepWorkCapacity as number,
      ambiguityTolerance: profile.ambiguityTolerance as number,
      routinePreference: profile.routinePreference as number,
      socialRecoveryValue: profile.socialRecoveryValue as number,
      exerciseRecoveryValue: profile.exerciseRecoveryValue as number,
      quietRecoveryValue: profile.quietRecoveryValue as number,
      overcommitmentRisk: profile.overcommitmentRisk as number,
      preferredRecoveryModes:
        preferredRecoveryModes.length > 0
          ? preferredRecoveryModes
          : getPreferredRecoveryModes(
              profile.quietRecoveryValue as number,
              profile.socialRecoveryValue as number,
              profile.exerciseRecoveryValue as number,
            ),
    };
  }

  if (hasStoredScoringState(profile)) {
    return buildCognitiveProfileFromScoringState({
      blockNeed: profile.blockNeed as number,
      fragmentationCost: profile.fragmentationCost as number,
      switchingCost: profile.switchingCost as number,
      setupLoad: profile.setupLoad as number,
      socialSpillover: profile.socialSpillover as number,
      passiveReset: profile.passiveReset as number,
      socialReset: profile.socialReset as number,
      physicalReset: profile.physicalReset as number,
      overcommitmentRisk: profile.overcommitmentRisk as number,
    });
  }

  return null;
}

export function normalizeStoredCognitiveProfile(
  profile: StoredCognitiveProfileSource | null | undefined,
): CognitiveProfileSnapshot | null {
  return getPlanningReadyCognitiveProfile(profile);
}

export function getLegacyCognitiveProfileFallback(
  profile: StoredCognitiveProfileSource | null | undefined,
): LegacyCognitiveProfileFallback | null {
  if (!profile || !hasLegacyCompatibilityProfile(profile)) {
    return null;
  }

  return {
    subtypeName:
      typeof profile.subtypeName === "string" ? (profile.subtypeName as SubtypeName) : undefined,
    subtypeDescription:
      "This profile was generated before canonical planning variables were stored directly.",
    shortSummary:
      "Retake the assessment to refresh this profile for recommendations and scoring.",
    fragmentationCost: profile.fragmentationSensitivity as number,
    deepWorkCapacity: profile.deepWorkPreference as number,
    ambiguityTolerance: clamp(6 - (profile.ambiguityFriction as number), 1, 5),
    socialRecoveryValue: profile.socialRecoveryBenefit as number,
    exerciseRecoveryValue: profile.exerciseRecoveryBenefit as number,
  };
}
