import { SITE_COPY } from "@/lib/copy";
import type { SubtypeName } from "@/lib/profile-model";

export type SignalLevel = "High" | "Medium" | "Low";

export type ProfileSignalKey =
  | "block_integrity_need"
  | "fragmentation_cost"
  | "startup_cost"
  | "load_sensitivity";

export interface SubtypePresentation {
  name: SubtypeName;
  description: string;
  corePattern: string;
  overviewLine: string;
}

export interface SignalPresentation {
  key: ProfileSignalKey;
  label: string;
  definition: string;
  interpretations: Record<SignalLevel, string>;
}

export const SUBTYPE_PRESENTATIONS: Record<SubtypeName, SubtypePresentation> = {
  "Protected-Block Planner": {
    name: "Protected-Block Planner",
    description: SITE_COPY.profile.subtypePresentations["Protected-Block Planner"].description,
    corePattern: SITE_COPY.profile.subtypePresentations["Protected-Block Planner"].corePattern,
    overviewLine: SITE_COPY.profile.subtypePresentations["Protected-Block Planner"].overviewLine,
  },
  "Short-Cycle Executor": {
    name: "Short-Cycle Executor",
    description: SITE_COPY.profile.subtypePresentations["Short-Cycle Executor"].description,
    corePattern: SITE_COPY.profile.subtypePresentations["Short-Cycle Executor"].corePattern,
    overviewLine: SITE_COPY.profile.subtypePresentations["Short-Cycle Executor"].overviewLine,
  },
  "Context-Sensitive Worker": {
    name: "Context-Sensitive Worker",
    description: SITE_COPY.profile.subtypePresentations["Context-Sensitive Worker"].description,
    corePattern: SITE_COPY.profile.subtypePresentations["Context-Sensitive Worker"].corePattern,
    overviewLine: SITE_COPY.profile.subtypePresentations["Context-Sensitive Worker"].overviewLine,
  },
  "Reset-Sensitive Scheduler": {
    name: "Reset-Sensitive Scheduler",
    description: SITE_COPY.profile.subtypePresentations["Reset-Sensitive Scheduler"].description,
    corePattern: SITE_COPY.profile.subtypePresentations["Reset-Sensitive Scheduler"].corePattern,
    overviewLine: SITE_COPY.profile.subtypePresentations["Reset-Sensitive Scheduler"].overviewLine,
  },
  "Adaptive Generalist": {
    name: "Adaptive Generalist",
    description: SITE_COPY.profile.subtypePresentations["Adaptive Generalist"].description,
    corePattern: SITE_COPY.profile.subtypePresentations["Adaptive Generalist"].corePattern,
    overviewLine: SITE_COPY.profile.subtypePresentations["Adaptive Generalist"].overviewLine,
  },
};

export const SIGNAL_PRESENTATIONS: Record<ProfileSignalKey, SignalPresentation> = {
  block_integrity_need: {
    key: "block_integrity_need",
    label: SITE_COPY.profile.signalLabels.block_integrity_need,
    definition: "Needs uninterrupted time for demanding work",
    interpretations: {
      Low: SITE_COPY.profile.signalInterpretations.block_integrity_need.Low,
      Medium: SITE_COPY.profile.signalInterpretations.block_integrity_need.Medium,
      High: SITE_COPY.profile.signalInterpretations.block_integrity_need.High,
    },
  },
  fragmentation_cost: {
    key: "fragmentation_cost",
    label: SITE_COPY.profile.signalLabels.fragmentation_cost,
    definition: "Short gaps reduce usable work capacity",
    interpretations: {
      Low: SITE_COPY.profile.signalInterpretations.fragmentation_cost.Low,
      Medium: SITE_COPY.profile.signalInterpretations.fragmentation_cost.Medium,
      High: SITE_COPY.profile.signalInterpretations.fragmentation_cost.High,
    },
  },
  startup_cost: {
    key: "startup_cost",
    label: SITE_COPY.profile.signalLabels.startup_cost,
    definition: "Open-ended work needs extra runway",
    interpretations: {
      Low: SITE_COPY.profile.signalInterpretations.startup_cost.Low,
      Medium: SITE_COPY.profile.signalInterpretations.startup_cost.Medium,
      High: SITE_COPY.profile.signalInterpretations.startup_cost.High,
    },
  },
  load_sensitivity: {
    key: "load_sensitivity",
    label: SITE_COPY.profile.signalLabels.load_sensitivity,
    definition: "Full weeks reduce output quickly",
    interpretations: {
      Low: SITE_COPY.profile.signalInterpretations.load_sensitivity.Low,
      Medium: SITE_COPY.profile.signalInterpretations.load_sensitivity.Medium,
      High: SITE_COPY.profile.signalInterpretations.load_sensitivity.High,
    },
  },
};

const PROFILE_GUIDANCE: Record<
  SubtypeName,
  {
    keepInMind: string[];
    planningRules: string[];
  }
> = {
  "Protected-Block Planner": {
    keepInMind: [...SITE_COPY.profile.subtypePresentations["Protected-Block Planner"].keepInMind],
    planningRules: [...SITE_COPY.profile.subtypePresentations["Protected-Block Planner"].planningRules],
  },
  "Short-Cycle Executor": {
    keepInMind: [...SITE_COPY.profile.subtypePresentations["Short-Cycle Executor"].keepInMind],
    planningRules: [...SITE_COPY.profile.subtypePresentations["Short-Cycle Executor"].planningRules],
  },
  "Context-Sensitive Worker": {
    keepInMind: [...SITE_COPY.profile.subtypePresentations["Context-Sensitive Worker"].keepInMind],
    planningRules: [...SITE_COPY.profile.subtypePresentations["Context-Sensitive Worker"].planningRules],
  },
  "Reset-Sensitive Scheduler": {
    keepInMind: [...SITE_COPY.profile.subtypePresentations["Reset-Sensitive Scheduler"].keepInMind],
    planningRules: [...SITE_COPY.profile.subtypePresentations["Reset-Sensitive Scheduler"].planningRules],
  },
  "Adaptive Generalist": {
    keepInMind: [...SITE_COPY.profile.subtypePresentations["Adaptive Generalist"].keepInMind],
    planningRules: [...SITE_COPY.profile.subtypePresentations["Adaptive Generalist"].planningRules],
  },
};

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function assertProfilePresentation() {
  const subtypeEntries = Object.values(SUBTYPE_PRESENTATIONS);
  const baselineKeys = Object.keys(subtypeEntries[0] ?? {}).sort().join(",");

  for (const entry of subtypeEntries) {
    if (getWordCount(entry.description) >= 25) {
      throw new Error(
        `Profile description for "${entry.name}" must stay under 25 words.`,
      );
    }

    if (getWordCount(entry.corePattern) >= 25) {
      throw new Error(
        `Profile core pattern for "${entry.name}" must stay under 25 words.`,
      );
    }

    if (getWordCount(entry.overviewLine) >= 25) {
      throw new Error(
        `Profile overview line for "${entry.name}" must stay under 25 words.`,
      );
    }

    const keys = Object.keys(entry).sort().join(",");
    if (keys !== baselineKeys) {
      throw new Error("All subtype presentations must share the same structure.");
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  assertProfilePresentation();
}

export function getSubtypePresentation(subtypeName: SubtypeName): SubtypePresentation {
  return SUBTYPE_PRESENTATIONS[subtypeName];
}

export function getSubtypeGuidance(subtypeName: SubtypeName) {
  return PROFILE_GUIDANCE[subtypeName];
}

export function getSignalPresentation(key: ProfileSignalKey): SignalPresentation {
  return SIGNAL_PRESENTATIONS[key];
}
