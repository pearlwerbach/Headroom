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
    description:
      "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
    corePattern:
      "Protected time matters more than how much open time the week appears to have.",
    overviewLine:
      "Your best work depends on protected time, and once a block is broken, depth is harder to recover.",
  },
  "Short-Cycle Executor": {
    name: "Short-Cycle Executor",
    description:
      "You can keep work moving in shorter cycles as long as tasks stay concrete and usable.",
    corePattern:
      "Momentum is easier to preserve than waiting for one ideal block later.",
    overviewLine:
      "You can make steady progress in shorter bursts, as long as the work stays clear and easy to re-enter.",
  },
  "Context-Sensitive Worker": {
    name: "Context-Sensitive Worker",
    description:
      "Your productivity depends heavily on how well your environment and task context match what you’re trying to do.",
    corePattern:
      "The same amount of time can feel easy or difficult depending on the surrounding context.",
    overviewLine:
      "Your usable time depends as much on context as it does on the clock.",
  },
  "Reset-Sensitive Scheduler": {
    name: "Reset-Sensitive Scheduler",
    description:
      "Switching between tasks or modes carries a real cost, and recovery between efforts is necessary to stay effective.",
    corePattern:
      "What looks like available time may not be usable without enough reset between demands.",
    overviewLine:
      "Starting and switching carry real cost, so the sequence of your week matters as much as the time itself.",
  },
  "Adaptive Generalist": {
    name: "Adaptive Generalist",
    description:
      "You can adapt across different kinds of work without needing highly specific conditions.",
    corePattern:
      "Consistency comes more from staying engaged than from optimizing the exact structure of your time.",
    overviewLine:
      "You can adapt across different kinds of work without heavy setup, which makes your time more consistently usable.",
  },
};

export const SIGNAL_PRESENTATIONS: Record<ProfileSignalKey, SignalPresentation> = {
  block_integrity_need: {
    key: "block_integrity_need",
    label: "Block Integrity Need",
    definition: "Needs uninterrupted time for demanding work",
    interpretations: {
      Low: "Demanding work is usually manageable without long protected blocks.",
      Medium: "Some protected time helps, but shorter usable blocks can still work.",
      High: "Demanding work works best when time is protected and interruptions stay low.",
    },
  },
  fragmentation_cost: {
    key: "fragmentation_cost",
    label: "Fragmentation Cost",
    definition: "Short gaps reduce usable work capacity",
    interpretations: {
      Low: "Short gaps and interruptions are usually manageable for keeping work moving.",
      Medium: "Some fragmented time stays usable, but cleaner blocks still work better.",
      High: "Broken time quickly reduces how much demanding work stays usable.",
    },
  },
  startup_cost: {
    key: "startup_cost",
    label: "Startup Cost",
    definition: "Open-ended work needs extra runway",
    interpretations: {
      Low: "Open-ended work becomes usable fairly quickly once you begin.",
      Medium: "Some setup time helps before open-ended work becomes fully productive.",
      High: "Open-ended work often needs narrowing before the block becomes usable.",
    },
  },
  load_sensitivity: {
    key: "load_sensitivity",
    label: "Load Sensitivity",
    definition: "Full weeks reduce output quickly",
    interpretations: {
      Low: "Busier weeks are usually manageable without a sharp drop in capacity.",
      Medium: "Load builds gradually, so week shape matters once demands stack up.",
      High: "Dense weeks reduce usable capacity quickly, even when the calendar looks open.",
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
    keepInMind: [
      "Open time can look easier than it actually is",
      "Fragmentation quickly reduces usable work",
      "Startup cost rises when tasks stay vague",
      "Full weeks feel tighter than they appear",
    ],
    planningRules: [
      "Protect clean blocks before filling the rest of the week.",
      "Turn open-ended work into concrete starts early.",
      "Treat fragmented time as support, not primary output time.",
    ],
  },
  "Short-Cycle Executor": {
    keepInMind: [
      "Short usable blocks can carry more than they look",
      "Momentum matters more than perfect timing",
      "Concrete tasks travel better than vague ones",
      "Overload still builds when too much stays open",
    ],
    planningRules: [
      "Break demanding work into clear continuation steps.",
      "Use short windows to keep work moving.",
      "Start earlier instead of waiting for one perfect block.",
    ],
  },
  "Context-Sensitive Worker": {
    keepInMind: [
      "The same hour can vary a lot by context",
      "Switching and fragmentation amplify each other",
      "Environment fit matters as much as open time",
      "Reset between modes preserves usable focus",
    ],
    planningRules: [
      "Group similar work before adding more total time.",
      "Reduce unnecessary context changes across the day.",
      "Place demanding work where context already supports it.",
    ],
  },
  "Reset-Sensitive Scheduler": {
    keepInMind: [
      "Available time can still be unusable after heavy demand",
      "Recovery quality changes what the next block can hold",
      "Switching costs accumulate before they feel obvious",
      "Dense days reduce later capacity",
    ],
    planningRules: [
      "Leave reset space before the next demanding block.",
      "Do not stack high-demand tasks without recovery.",
      "Plan capacity around reset, not just open time.",
    ],
  },
  "Adaptive Generalist": {
    keepInMind: [
      "Many different structures can still work for you",
      "Engagement matters more than ideal conditions",
      "Small windows can stay useful when tasks are clear",
      "Overload can build quietly when commitments spread",
    ],
    planningRules: [
      "Use flexible windows while the week is still light.",
      "Keep tasks concrete enough to start in imperfect time.",
      "Watch scope before flexibility turns into overcommitment.",
    ],
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
