import type { WorkProfile } from "@prisma/client";
import { normalizeStoredCognitiveProfile } from "@/lib/cognitive-profile";
import {
  getSignalPresentation,
  getSubtypeGuidance,
  getSubtypePresentation,
  type ProfileSignalKey,
  type SignalLevel,
} from "@/lib/profile-presentation";
import {
  getPlanningRiskFlags,
  getRawQuizAnswers,
  getSubtypeName as getStoredSubtypeName,
  getSubtypeScoreBreakdown,
  isPlanningRiskFlag,
  isSubtypeName,
  type LatentVariables,
  type PlanningRiskFlag,
  type RawQuizAnswers,
  type SubtypeContribution,
  type SubtypeName,
  type SubtypeScoreBreakdown,
} from "@/lib/profile-model";
import { clamp } from "@/lib/utils";

export type ProfileSnapshot = Pick<
  WorkProfile,
  | "id"
  | "updatedAt"
  | "rawAnswers"
  | "modelVersion"
  | "blockNeed"
  | "fragmentationCost"
  | "switchingCost"
  | "setupLoad"
  | "socialSpillover"
  | "passiveReset"
  | "socialReset"
  | "physicalReset"
  | "overcommitmentRisk"
  | "subtypeName"
  | "subtypeDescription"
  | "shortSummary"
  | "overloadSensitivity"
  | "transitionCost"
  | "deepWorkCapacity"
  | "ambiguityTolerance"
  | "routinePreference"
  | "socialRecoveryValue"
  | "exerciseRecoveryValue"
  | "quietRecoveryValue"
  | "preferredRecoveryModes"
  | "riskFlags"
  | "deepWorkPreference"
  | "fragmentationSensitivity"
  | "socialLoadCost"
  | "ambiguityFriction"
  | "exerciseRecoveryBenefit"
  | "socialRecoveryBenefit"
  | "prefersLongBlocks"
  | "underestimatesOpenEndedWork"
>;

interface DebugModel {
  isLegacy: boolean;
  branchTaken?: "explicit_v1_canonical" | "explicit_v1_fallback" | "legacy_profile_fallback";
  renderSource?: "canonical_profile" | "legacy_fallback";
  legacyMessage?: string;
  rawLoadedProfile?: {
    id?: string;
    updatedAt?: string;
    subtypeName?: string | null;
    subtypeDescription?: string | null;
    shortSummary?: string | null;
    modelVersion?: string | null;
    canonicalVariables?: Record<string, number | null | undefined>;
  };
  loadedProfile?: {
    id?: string;
    updatedAt?: string;
    subtypeName?: string | null;
    canonicalVariables?: Record<string, number | null | undefined>;
  };
  renderedProfile?: {
    subtypeName?: string;
    description?: string;
    whatThisMeans?: string;
    canonicalVariables?: Record<string, number | null | undefined>;
  };
  rawAnswers?: RawQuizAnswers;
  modelVersion?: string | null;
  variables?: LatentVariables;
  riskFlags?: PlanningRiskFlag[];
  subtypeName?: SubtypeName;
  subtypeScoreBreakdown?: SubtypeScoreBreakdown[];
  subtypeSupport?: SubtypeContribution[];
}

export interface CognitiveSubtype {
  name: string;
  explanation: string;
}

export interface OperatingRules {
  corePlanningMistake: string;
  startRule: { title: string; explanation: string };
  blockRule: { title: string; explanation: string };
  trapRule: { title: string; explanation: string };
  recoveryRule: { title: string; explanation: string };
}

export interface ProfileSignal {
  key: ProfileSignalKey;
  label: string;
  value: SignalLevel;
  definition: string;
  description: string;
}

export interface ProfileModel {
  profileName: string;
  description: string;
  whatThisMeans: string;
  signals: ProfileSignal[];
  keepInMind: string[];
  planningRules: string[];
  debug: DebugModel;
}

function getLevel(value: number): SignalLevel {
  if (value >= 4) {
    return "High";
  }

  if (value <= 2) {
    return "Low";
  }

  return "Medium";
}

function getLegacyVariables(profile: ProfileSnapshot): LatentVariables {
  return {
    blockNeed: profile.deepWorkPreference,
    fragmentationCost: profile.fragmentationSensitivity,
    switchingCost: clamp(
      Math.ceil(
        (profile.fragmentationSensitivity + Math.max(profile.socialLoadCost, 2)) / 2,
      ),
      1,
      5,
    ),
    setupLoad: profile.ambiguityFriction,
    socialSpillover: profile.socialLoadCost,
    passiveReset: clamp(
      Math.round(
        (profile.exerciseRecoveryBenefit + profile.socialRecoveryBenefit) / 2,
      ),
      1,
      5,
    ),
    socialReset: profile.socialRecoveryBenefit,
    physicalReset: profile.exerciseRecoveryBenefit,
    overcommitmentRisk: 3,
  };
}

function getStoredVariables(profile: ProfileSnapshot): LatentVariables | null {
  const keys: Array<keyof LatentVariables> = [
    "blockNeed",
    "fragmentationCost",
    "switchingCost",
    "setupLoad",
    "socialSpillover",
    "passiveReset",
    "socialReset",
    "physicalReset",
    "overcommitmentRisk",
  ];

  if (keys.some((key) => typeof profile[key] !== "number")) {
    return null;
  }

  return {
    blockNeed: profile.blockNeed as number,
    fragmentationCost: profile.fragmentationCost as number,
    switchingCost: profile.switchingCost as number,
    setupLoad: profile.setupLoad as number,
    socialSpillover: profile.socialSpillover as number,
    passiveReset: profile.passiveReset as number,
    socialReset: profile.socialReset as number,
    physicalReset: profile.physicalReset as number,
    overcommitmentRisk: profile.overcommitmentRisk as number,
  };
}

function getStoredRiskFlags(profile: ProfileSnapshot): PlanningRiskFlag[] {
  return Array.isArray(profile.riskFlags)
    ? profile.riskFlags.filter(isPlanningRiskFlag)
    : [];
}

function getLoadSensitivityValue(variables: LatentVariables) {
  const recoveryWeakness = clamp(
    Math.round(
      (
        (6 - variables.passiveReset) +
        (6 - variables.socialReset) +
        (6 - variables.physicalReset)
      ) / 3
    ),
    1,
    5,
  );

  return clamp(
    Math.round(
      (variables.socialSpillover + variables.overcommitmentRisk + recoveryWeakness) / 3,
    ),
    1,
    5,
  );
}

function buildSignalsFromCurrentProfile(
  variables: LatentVariables,
  canonicalProfile?: ReturnType<typeof normalizeStoredCognitiveProfile> | null,
): ProfileSignal[] {
  const startupSource =
    canonicalProfile?.ambiguityTolerance != null
      ? clamp(6 - canonicalProfile.ambiguityTolerance, 1, 5)
      : variables.setupLoad;
  const loadSource = canonicalProfile?.overloadSensitivity ?? getLoadSensitivityValue(variables);
  const signalLevels = {
    block_integrity_need: getLevel(canonicalProfile?.deepWorkCapacity ?? variables.blockNeed),
    fragmentation_cost: getLevel(canonicalProfile?.fragmentationCost ?? variables.fragmentationCost),
    startup_cost: getLevel(startupSource),
    load_sensitivity: getLevel(loadSource),
  } satisfies Record<ProfileSignal["key"], SignalLevel>;

  return (Object.keys(signalLevels) as ProfileSignal["key"][]).map((key) => ({
    key,
    label: getSignalPresentation(key).label,
    value: signalLevels[key],
    definition: getSignalPresentation(key).definition,
    description: getSignalPresentation(key).interpretations[signalLevels[key]],
  }));
}

function buildProfileModel(
  subtype: SubtypeName,
  variables: LatentVariables,
  debug: DebugModel,
  canonicalProfile?: ReturnType<typeof normalizeStoredCognitiveProfile> | null,
): ProfileModel {
  const presentation = getSubtypePresentation(subtype);
  const guidance = getSubtypeGuidance(subtype);

  return {
    profileName: presentation.name,
    description: presentation.description,
    whatThisMeans: presentation.corePattern,
    signals: buildSignalsFromCurrentProfile(variables, canonicalProfile),
    keepInMind: guidance.keepInMind,
    planningRules: guidance.planningRules,
    debug,
  };
}

function buildCanonicalProfileModel(
  canonicalProfile: NonNullable<ReturnType<typeof normalizeStoredCognitiveProfile>>,
  debug: DebugModel,
): ProfileModel {
  const presentation = getSubtypePresentation(canonicalProfile.subtypeName);
  const guidance = getSubtypeGuidance(canonicalProfile.subtypeName);
  const canonicalVariables = {
    overloadSensitivity: canonicalProfile.overloadSensitivity,
    fragmentationCost: canonicalProfile.fragmentationCost,
    transitionCost: canonicalProfile.transitionCost,
    deepWorkCapacity: canonicalProfile.deepWorkCapacity,
    ambiguityTolerance: canonicalProfile.ambiguityTolerance,
    routinePreference: canonicalProfile.routinePreference,
    socialRecoveryValue: canonicalProfile.socialRecoveryValue,
    exerciseRecoveryValue: canonicalProfile.exerciseRecoveryValue,
    quietRecoveryValue: canonicalProfile.quietRecoveryValue,
    overcommitmentRisk: canonicalProfile.overcommitmentRisk,
  };

  const model: ProfileModel = {
    profileName: presentation.name,
    description: presentation.description,
    whatThisMeans: presentation.corePattern,
    signals: buildSignalsFromCurrentProfile(
      {
        blockNeed: canonicalProfile.deepWorkCapacity,
        fragmentationCost: canonicalProfile.fragmentationCost,
        switchingCost: canonicalProfile.transitionCost,
        setupLoad: clamp(6 - canonicalProfile.ambiguityTolerance, 1, 5),
        socialSpillover: canonicalProfile.overloadSensitivity,
        passiveReset: canonicalProfile.quietRecoveryValue,
        socialReset: canonicalProfile.socialRecoveryValue,
        physicalReset: canonicalProfile.exerciseRecoveryValue,
        overcommitmentRisk: canonicalProfile.overcommitmentRisk,
      },
      canonicalProfile,
    ),
    keepInMind: guidance.keepInMind,
    planningRules: guidance.planningRules,
    debug: {
      ...debug,
      renderSource: "canonical_profile",
      renderedProfile: {
        subtypeName: presentation.name,
        description: presentation.description,
        whatThisMeans: presentation.corePattern,
        canonicalVariables,
      },
    },
  };

  return model;
}

export function getCognitiveSubtype(profile: ProfileSnapshot): CognitiveSubtype {
  const model = getProfileModel(profile);

  return {
    name: model.profileName,
    explanation: model.description,
  };
}

export function getOperatingRulesForProfile(profile: ProfileSnapshot): OperatingRules {
  const model = getProfileModel(profile);

  return {
    corePlanningMistake: model.whatThisMeans,
    startRule: {
      title: model.planningRules[0] ?? "",
      explanation: "",
    },
    blockRule: {
      title: model.planningRules[1] ?? "",
      explanation: "",
    },
    trapRule: {
      title: model.keepInMind[0] ?? "",
      explanation: "",
    },
    recoveryRule: {
      title: model.planningRules[2] ?? "",
      explanation: "",
    },
  };
}

export function getOperatingRules(profile: ProfileSnapshot): OperatingRules {
  return getOperatingRulesForProfile(profile);
}

export function getProfileModel(profile: ProfileSnapshot): ProfileModel {
  const explicitVariables = getStoredVariables(profile);
  const explicitAnswers = getRawQuizAnswers(profile.rawAnswers);
  const canonicalProfile = normalizeStoredCognitiveProfile(profile);
  const rawLoadedProfile = {
    id: profile.id,
    updatedAt: profile.updatedAt?.toISOString(),
    subtypeName: profile.subtypeName,
    subtypeDescription: profile.subtypeDescription,
    shortSummary: profile.shortSummary,
    modelVersion: profile.modelVersion,
    canonicalVariables: {
      overloadSensitivity: profile.overloadSensitivity,
      fragmentationCost: profile.fragmentationCost,
      transitionCost: profile.transitionCost,
      deepWorkCapacity: profile.deepWorkCapacity,
      ambiguityTolerance: profile.ambiguityTolerance,
      routinePreference: profile.routinePreference,
      socialRecoveryValue: profile.socialRecoveryValue,
      exerciseRecoveryValue: profile.exerciseRecoveryValue,
      quietRecoveryValue: profile.quietRecoveryValue,
      overcommitmentRisk: profile.overcommitmentRisk,
    },
  };
  const loadedProfile = {
    id: rawLoadedProfile.id,
    updatedAt: rawLoadedProfile.updatedAt,
    subtypeName: rawLoadedProfile.subtypeName,
    canonicalVariables: rawLoadedProfile.canonicalVariables,
  };

  if (profile.modelVersion === "v1" && explicitVariables && explicitAnswers) {
    const riskFlags = getStoredRiskFlags(profile);
    const storedSubtype = isSubtypeName(profile.subtypeName)
      ? profile.subtypeName
      : getStoredSubtypeName(explicitVariables, riskFlags);
    const subtypeScoreBreakdown = getSubtypeScoreBreakdown(explicitVariables);
    const subtypeSupport =
      subtypeScoreBreakdown
        .find((candidate) => candidate.subtype === storedSubtype)
        ?.contributors.slice(0, 3) ?? [];

    const debug: DebugModel = {
      isLegacy: false,
      branchTaken: canonicalProfile ? "explicit_v1_canonical" : "explicit_v1_fallback",
      renderSource: canonicalProfile ? "canonical_profile" : "legacy_fallback",
      rawLoadedProfile,
      loadedProfile,
      rawAnswers: explicitAnswers,
      modelVersion: profile.modelVersion,
      variables: explicitVariables,
      riskFlags,
      subtypeName: storedSubtype,
      subtypeScoreBreakdown,
      subtypeSupport,
    };

    if (canonicalProfile) {
      return buildCanonicalProfileModel(canonicalProfile, debug);
    }

    return buildProfileModel(storedSubtype, explicitVariables, debug, canonicalProfile);
  }

  const legacyVariables = getLegacyVariables(profile);
  const riskFlags = getPlanningRiskFlags(legacyVariables);
  const storedSubtype = getStoredSubtypeName(legacyVariables, riskFlags);

  const model = buildProfileModel(storedSubtype, legacyVariables, {
    isLegacy: true,
    branchTaken: "legacy_profile_fallback",
    renderSource: "legacy_fallback",
    rawLoadedProfile,
    loadedProfile,
    legacyMessage: "Retake quiz to generate inspectable model data.",
    modelVersion: profile.modelVersion,
    variables: legacyVariables,
    riskFlags,
    subtypeName: storedSubtype,
  }, canonicalProfile);

  return {
    ...model,
    debug: {
      ...model.debug,
      renderedProfile: {
        subtypeName: model.profileName,
        description: model.description,
        whatThisMeans: model.whatThisMeans,
        canonicalVariables: canonicalProfile
          ? {
              overloadSensitivity: canonicalProfile.overloadSensitivity,
              fragmentationCost: canonicalProfile.fragmentationCost,
              transitionCost: canonicalProfile.transitionCost,
              deepWorkCapacity: canonicalProfile.deepWorkCapacity,
              ambiguityTolerance: canonicalProfile.ambiguityTolerance,
              routinePreference: canonicalProfile.routinePreference,
              socialRecoveryValue: canonicalProfile.socialRecoveryValue,
              exerciseRecoveryValue: canonicalProfile.exerciseRecoveryValue,
              quietRecoveryValue: canonicalProfile.quietRecoveryValue,
              overcommitmentRisk: canonicalProfile.overcommitmentRisk,
            }
          : undefined,
      },
    },
    profileName: canonicalProfile?.subtypeName ?? model.profileName,
    description: model.description,
    whatThisMeans: model.whatThisMeans,
  };
}
