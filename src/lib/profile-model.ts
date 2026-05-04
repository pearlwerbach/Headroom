import { PROFILE_MODEL_VERSION } from "@/lib/constants";
import { SITE_COPY } from "@/lib/copy";
import { clamp } from "@/lib/utils";

export const QUESTION_IDS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
] as const;

export const ANSWER_VALUES = ["A", "B", "C", "D"] as const;
export const SUBTYPE_NAMES = [
  "Short-Cycle Executor",
  "Protected-Block Planner",
  "Context-Sensitive Worker",
  "Reset-Sensitive Scheduler",
  "Adaptive Generalist",
] as const;
export const PLANNING_RISK_FLAGS = [
  "Rescue Block Risk",
  "False Free Time Risk",
  "Social Carryover Risk",
  "Setup Trap Risk",
  "Weak Recovery Risk",
  "Mode-Switching Risk",
  "Overcommitment Risk Flag",
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];
export type AnswerValue = (typeof ANSWER_VALUES)[number];
export type LatentVariableKey =
  | "blockNeed"
  | "fragmentationCost"
  | "switchingCost"
  | "setupLoad"
  | "socialSpillover"
  | "passiveReset"
  | "socialReset"
  | "physicalReset"
  | "overcommitmentRisk";

export type PlanningRiskFlag = (typeof PLANNING_RISK_FLAGS)[number];
export type SubtypeName = (typeof SUBTYPE_NAMES)[number];

export type RawQuizAnswers = Record<QuestionId, AnswerValue>;

export interface LatentVariables {
  blockNeed: number;
  fragmentationCost: number;
  switchingCost: number;
  setupLoad: number;
  socialSpillover: number;
  passiveReset: number;
  socialReset: number;
  physicalReset: number;
  overcommitmentRisk: number;
}

export type EffectMap = Partial<Record<LatentVariableKey, number>>;

export interface QuizOption {
  value: AnswerValue;
  label: string;
  hint: string;
  effects: EffectMap;
}

export interface QuizQuestion {
  id: QuestionId;
  prompt: string;
  options: QuizOption[];
}

export interface CompatibilityProjection {
  deepWorkPreference: number;
  fragmentationSensitivity: number;
  socialLoadCost: number;
  ambiguityFriction: number;
  exerciseRecoveryBenefit: number;
  socialRecoveryBenefit: number;
  prefersLongBlocks: boolean;
  underestimatesOpenEndedWork: boolean;
}

export interface SubtypeContribution {
  variable: LatentVariableKey;
  direction: "high" | "low" | "neutral";
  contribution: number;
}

export interface SubtypeScoreBreakdown {
  subtype: SubtypeName;
  score: number;
  contributors: SubtypeContribution[];
}

export interface ExplicitProfileModel {
  rawAnswers: RawQuizAnswers;
  modelVersion: typeof PROFILE_MODEL_VERSION;
  variables: LatentVariables;
  riskFlags: PlanningRiskFlag[];
  subtypeName: SubtypeName;
  subtypeScoreBreakdown: SubtypeScoreBreakdown[];
  subtypeSupport: SubtypeContribution[];
  compatibilityProjection: CompatibilityProjection;
}

export const INITIAL_VARIABLES: LatentVariables = {
  blockNeed: 3,
  fragmentationCost: 3,
  switchingCost: 3,
  setupLoad: 3,
  socialSpillover: 3,
  passiveReset: 3,
  socialReset: 3,
  physicalReset: 3,
  overcommitmentRisk: 3,
};

const SUBTYPE_BREAKDOWN_VARIABLES: Record<
  SubtypeName,
  Array<{ variable: LatentVariableKey; direction: "high" | "low" | "neutral" }>
> = {
  "Short-Cycle Executor": [
    { variable: "blockNeed", direction: "low" },
    { variable: "fragmentationCost", direction: "low" },
    { variable: "switchingCost", direction: "low" },
  ],
  "Protected-Block Planner": [
    { variable: "blockNeed", direction: "high" },
    { variable: "fragmentationCost", direction: "high" },
    { variable: "switchingCost", direction: "high" },
  ],
  "Context-Sensitive Worker": [
    { variable: "switchingCost", direction: "high" },
    { variable: "socialSpillover", direction: "high" },
    { variable: "fragmentationCost", direction: "high" },
  ],
  "Reset-Sensitive Scheduler": [
    { variable: "passiveReset", direction: "low" },
    { variable: "socialReset", direction: "low" },
    { variable: "physicalReset", direction: "low" },
    { variable: "socialSpillover", direction: "high" },
  ],
  "Adaptive Generalist": [
    { variable: "blockNeed", direction: "neutral" },
    { variable: "fragmentationCost", direction: "neutral" },
    { variable: "switchingCost", direction: "neutral" },
    { variable: "setupLoad", direction: "neutral" },
  ],
};

function makeOptions(
  a: [string, string, EffectMap],
  b: [string, string, EffectMap],
  c: [string, string, EffectMap],
  d: [string, string, EffectMap],
): QuizOption[] {
  return [
    { value: "A", label: a[0], hint: a[1], effects: a[2] },
    { value: "B", label: b[0], hint: b[1], effects: b[2] },
    { value: "C", label: c[0], hint: c[1], effects: c[2] },
    { value: "D", label: d[0], hint: d[1], effects: d[2] },
  ];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[0].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[0].options[0], "Shorter cycles tend to carry the work well.", { blockNeed: -2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[0].options[1], "A moderate block is usually enough.", {}],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[0].options[2], "Demanding work needs a long protected block.", { blockNeed: 2 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[0].options[3],
        "Startup cost matters more than block length.",
        { setupLoad: 1 },
      ],
    ),
  },
  {
    id: "q2",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[1].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[1].options[0], "Short gaps can still carry meaningful work.", { fragmentationCost: -2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[1].options[1], "They work once the task is already clear.", {}],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[1].options[2], "Short gaps rarely hold enough momentum.", { fragmentationCost: 2 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[1].options[3],
        "Restart cost makes the gap disappear.",
        { fragmentationCost: 2, setupLoad: 1 },
      ],
    ),
  },
  {
    id: "q3",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[2].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[2].options[0], "Switches do not change the day much.", { switchingCost: -2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[2].options[1], "There is some friction, but it is workable.", {}],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[2].options[2], "Switching costs real momentum.", { switchingCost: 1 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[2].options[3],
        "Too many switches degrade the rest of the day.",
        { switchingCost: 2 },
      ],
    ),
  },
  {
    id: "q4",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[3].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[3].options[0], "The task becomes usable quickly.", { setupLoad: -2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[3].options[1], "A small amount of runway is enough.", { setupLoad: -1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[3].options[2], "Part of the block goes to setup.", { setupLoad: 1 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[3].options[3],
        "The startup cost can dominate the block.",
        { setupLoad: 2 },
      ],
    ),
  },
  {
    id: "q5",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[4].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[4].options[0], "The next block is still usable.", { socialSpillover: -2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[4].options[1], "The next block softens a bit.", { socialSpillover: -1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[4].options[2], "The next block is clearly downgraded.", { socialSpillover: 1 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[4].options[3],
        "The carryover changes what the next block can hold.",
        { socialSpillover: 2 },
      ],
    ),
  },
  {
    id: "q6",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[5].prompt,
    options: makeOptions(
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[5].options[0],
        "Passive downtime is the most reliable reset.",
        { passiveReset: 2, socialReset: -1 },
      ],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[5].options[1],
        "Low-stakes social time restores capacity best.",
        { socialReset: 2, passiveReset: -1 },
      ],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[5].options[2], "Physical reset is the most reliable.", { physicalReset: 2 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[5].options[3],
        "Recovery becomes hard once the day is too loaded.",
        { passiveReset: -1, socialReset: -1, physicalReset: -1 },
      ],
    ),
  },
  {
    id: "q7",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[6].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[6].options[0], "Passive downtime usually gives usable capacity back.", { passiveReset: 2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[6].options[1], "It works, just not strongly.", { passiveReset: 1 }],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[6].options[2],
        "It feels restorative without fully changing the next block.",
        { passiveReset: -1 },
      ],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[6].options[3], "The break can increase restart cost.", { passiveReset: -2 }],
    ),
  },
  {
    id: "q8",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[7].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[7].options[0], "Movement reliably improves the next block.", { physicalReset: 2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[7].options[1], "It is useful, but not always enough.", { physicalReset: 1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[7].options[2], "It helps, but not mainly with later focus.", { physicalReset: -1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[7].options[3], "It should not be treated as a dependable cognitive reset.", { physicalReset: -2 }],
    ),
  },
  {
    id: "q9",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[8].prompt,
    options: makeOptions(
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[8].options[0], "The week slips while you hold out for a better block.", { blockNeed: -1, setupLoad: 1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[8].options[1], "Broken time and switching make the hard work stall.", { fragmentationCost: 2, switchingCost: 1 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[8].options[2], "The surrounding work blocks degrade more than expected.", { socialSpillover: 2 }],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[8].options[3], "The task stays undefined too long.", { setupLoad: 2 }],
    ),
  },
  {
    id: "q10",
    prompt: SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[9].prompt,
    options: makeOptions(
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[9].options[0],
        "The plan assumes better conditions than the week usually gives.",
        { blockNeed: 1, overcommitmentRisk: 1 },
      ],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[9].options[1],
        "The week compresses more than the plan accounts for.",
        { fragmentationCost: 1, switchingCost: 1, overcommitmentRisk: 1 },
      ],
      [
        SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[9].options[2],
        "The plan misses how much work expands once it's underway.",
        { setupLoad: 1, overcommitmentRisk: 2 },
      ],
      [SITE_COPY.onboarding.COPY_ONBOARDING_QUESTIONS[9].options[3], "The week overloads before the plan catches it.", { overcommitmentRisk: 2 }],
    ),
  },
];

export const QUESTION_EFFECTS: Record<QuestionId, Record<AnswerValue, EffectMap>> = Object.fromEntries(
  quizQuestions.map((question) => [
    question.id,
    Object.fromEntries(question.options.map((option) => [option.value, option.effects])),
  ]),
) as Record<QuestionId, Record<AnswerValue, EffectMap>>;

function isLow(value: number) {
  return value <= 2;
}

function isMedium(value: number) {
  return value === 3;
}

function isHigh(value: number) {
  return value >= 4;
}

function isMediumOrHigh(value: number) {
  return value >= 3;
}

function isLowOrMedium(value: number) {
  return value <= 3;
}

function normalizeContribution(
  value: number,
  direction: "high" | "low" | "neutral",
): number {
  if (direction === "high") {
    return value;
  }

  if (direction === "low") {
    return 6 - value;
  }

  return 6 - Math.abs(value - 3) * 2;
}

export function isAnswerValue(value: unknown): value is AnswerValue {
  return typeof value === "string" && ANSWER_VALUES.includes(value as AnswerValue);
}

export function isQuestionId(value: unknown): value is QuestionId {
  return typeof value === "string" && QUESTION_IDS.includes(value as QuestionId);
}

export function isSubtypeName(value: unknown): value is SubtypeName {
  return typeof value === "string" && SUBTYPE_NAMES.includes(value as SubtypeName);
}

export function isPlanningRiskFlag(value: unknown): value is PlanningRiskFlag {
  return typeof value === "string" && PLANNING_RISK_FLAGS.includes(value as PlanningRiskFlag);
}

export function getRawQuizAnswers(value: unknown): RawQuizAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const answers: Partial<RawQuizAnswers> = {};

  for (const questionId of QUESTION_IDS) {
    const answer = (value as Record<string, unknown>)[questionId];

    if (!isAnswerValue(answer)) {
      return null;
    }

    answers[questionId] = answer;
  }

  return answers as RawQuizAnswers;
}

export function scoreExplicitProfile(answers: RawQuizAnswers): ExplicitProfileModel {
  const totals = { ...INITIAL_VARIABLES };

  for (const questionId of QUESTION_IDS) {
    const selected = answers[questionId];
    const effect = QUESTION_EFFECTS[questionId][selected];

    for (const [variable, delta] of Object.entries(effect)) {
      const key = variable as LatentVariableKey;
      totals[key] += delta ?? 0;
    }
  }

  const variables: LatentVariables = {
    blockNeed: clamp(totals.blockNeed, 1, 5),
    fragmentationCost: clamp(totals.fragmentationCost, 1, 5),
    switchingCost: clamp(totals.switchingCost, 1, 5),
    setupLoad: clamp(totals.setupLoad, 1, 5),
    socialSpillover: clamp(totals.socialSpillover, 1, 5),
    passiveReset: clamp(totals.passiveReset, 1, 5),
    socialReset: clamp(totals.socialReset, 1, 5),
    physicalReset: clamp(totals.physicalReset, 1, 5),
    overcommitmentRisk: clamp(totals.overcommitmentRisk, 1, 5),
  };

  const riskFlags = getPlanningRiskFlags(variables);
  const subtypeName = getSubtypeName(variables, riskFlags);
  const subtypeScoreBreakdown = getSubtypeScoreBreakdown(variables);
  const subtypeSupport =
    subtypeScoreBreakdown.find((candidate) => candidate.subtype === subtypeName)?.contributors.slice(0, 3) ??
    [];

  return {
    rawAnswers: answers,
    modelVersion: PROFILE_MODEL_VERSION,
    variables,
    riskFlags,
    subtypeName,
    subtypeScoreBreakdown,
    subtypeSupport,
    compatibilityProjection: getCompatibilityProjection(variables, riskFlags),
  };
}

export function getPlanningRiskFlags(variables: LatentVariables): PlanningRiskFlag[] {
  const weakRecoveryModes = [
    variables.passiveReset,
    variables.socialReset,
    variables.physicalReset,
  ].filter((value) => isLow(value)).length;

  return [
    ...(isLow(variables.blockNeed) && isMediumOrHigh(variables.setupLoad)
      ? (["Rescue Block Risk"] as const)
      : []),
    ...(isHigh(variables.fragmentationCost) ||
    (isMedium(variables.fragmentationCost) && isHigh(variables.switchingCost))
      ? (["False Free Time Risk"] as const)
      : []),
    ...(isHigh(variables.socialSpillover) ? (["Social Carryover Risk"] as const) : []),
    ...(isHigh(variables.setupLoad) ? (["Setup Trap Risk"] as const) : []),
    ...(weakRecoveryModes >= 2 ? (["Weak Recovery Risk"] as const) : []),
    ...(isHigh(variables.switchingCost) ? (["Mode-Switching Risk"] as const) : []),
    ...(isHigh(variables.overcommitmentRisk)
      ? (["Overcommitment Risk Flag"] as const)
      : []),
  ];
}

export function getSubtypeName(
  variables: LatentVariables,
  _riskFlags: PlanningRiskFlag[],
): SubtypeName {
  void _riskFlags;
  const weakRecoveryModes = [
    variables.passiveReset,
    variables.socialReset,
    variables.physicalReset,
  ].filter((value) => isLow(value)).length;

  if (
    isHigh(variables.blockNeed) &&
    isHigh(variables.fragmentationCost) &&
    isMediumOrHigh(variables.setupLoad)
  ) {
    return "Protected-Block Planner";
  }

  if (
    isHigh(variables.socialSpillover) &&
    weakRecoveryModes >= 2
  ) {
    return "Reset-Sensitive Scheduler";
  }

  if (
    isHigh(variables.switchingCost) &&
    isMediumOrHigh(variables.fragmentationCost) &&
    isMediumOrHigh(variables.socialSpillover)
  ) {
    return "Context-Sensitive Worker";
  }

  if (
    isLow(variables.blockNeed) &&
    isLowOrMedium(variables.fragmentationCost) &&
    !isHigh(variables.setupLoad)
  ) {
    return "Short-Cycle Executor";
  }

  if (
    isMedium(variables.blockNeed) &&
    isMedium(variables.fragmentationCost) &&
    isLowOrMedium(variables.switchingCost) &&
    isLowOrMedium(variables.socialSpillover) &&
    isMediumOrHigh(variables.setupLoad)
  ) {
    return "Adaptive Generalist";
  }

  return "Adaptive Generalist";
}

export function getSubtypeScoreBreakdown(
  variables: LatentVariables,
): SubtypeScoreBreakdown[] {
  return (Object.entries(SUBTYPE_BREAKDOWN_VARIABLES) as Array<
    [SubtypeName, Array<{ variable: LatentVariableKey; direction: "high" | "low" | "neutral" }>]
  >).map(([subtype, contributors]) => {
    const scoredContributors = contributors
      .map(({ variable, direction }) => ({
        variable,
        direction,
        contribution: normalizeContribution(variables[variable], direction),
      }))
      .sort((left, right) => right.contribution - left.contribution);

    return {
      subtype,
      score: scoredContributors.reduce(
        (total, contributor) => total + contributor.contribution,
        0,
      ),
      contributors: scoredContributors,
    };
  });
}

export function getCompatibilityProjection(
  variables: LatentVariables,
  riskFlags: PlanningRiskFlag[],
): CompatibilityProjection {
  return {
    deepWorkPreference: variables.blockNeed,
    fragmentationSensitivity: variables.fragmentationCost,
    socialLoadCost: variables.socialSpillover,
    ambiguityFriction: variables.setupLoad,
    exerciseRecoveryBenefit: variables.physicalReset,
    socialRecoveryBenefit: variables.socialReset,
    prefersLongBlocks: variables.blockNeed >= 4,
    underestimatesOpenEndedWork:
      variables.setupLoad >= 4 || riskFlags.includes("Setup Trap Risk"),
  };
}
