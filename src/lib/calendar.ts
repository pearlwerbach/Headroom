import type { RecoveryMode } from "@/lib/cognitive-profile";
import type {
  CognitiveProfileSnapshot,
  EventType,
  EventTypeSource,
} from "@/lib/domain";

const demandKeywords = [
  "class",
  "lecture",
  "seminar",
  "exam",
  "quiz",
  "office hours",
  "meeting",
  "shift",
  "lab",
  "work",
];

const workoutKeywords = ["workout", "gym", "walk", "run", "pilates", "yoga"];
const socialKeywords = ["party", "club", "dinner", "hangout", "friends", "social"];
const quietKeywords = [
  "read",
  "reading",
  "library",
  "meditation",
  "meditate",
  "journal",
  "journaling",
  "nap",
  "rest",
  "reset",
  "quiet",
  "solo",
  "alone",
];
const neutralKeywords = ["commute", "transit", "travel", "meal", "lunch", "breakfast", "dinner"];

function normalizeTitle(title: string) {
  return title.toLowerCase();
}

export function isWorkoutEvent(title: string) {
  const normalized = normalizeTitle(title);
  return workoutKeywords.some((keyword) => normalized.includes(keyword));
}

export function isSocialEvent(title: string) {
  const normalized = normalizeTitle(title);
  return socialKeywords.some((keyword) => normalized.includes(keyword));
}

export function isQuietRecoveryEvent(title: string) {
  const normalized = normalizeTitle(title);
  return quietKeywords.some((keyword) => normalized.includes(keyword));
}

export interface EventInterpretation {
  type: EventType;
  source: EventTypeSource;
  recoveryMode: RecoveryMode | null;
}

function inferProfileEventInterpretation(
  title: string,
  profile?: Pick<
    Partial<CognitiveProfileSnapshot>,
    | "exerciseRecoveryValue"
    | "socialRecoveryValue"
    | "quietRecoveryValue"
    | "preferredRecoveryModes"
    | "overloadSensitivity"
  > | null,
): Omit<EventInterpretation, "source"> | null {
  const normalized = normalizeTitle(title);

  if (demandKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      type: "demand",
      recoveryMode: null,
    };
  }

  if (!profile) {
    if (neutralKeywords.some((keyword) => normalized.includes(keyword))) {
      return {
        type: "neutral",
        recoveryMode: null,
      };
    }

    return null;
  }

  const preferredRecoveryModes = profile.preferredRecoveryModes ?? [];

  if (isWorkoutEvent(normalized)) {
    const exerciseValue = profile.exerciseRecoveryValue ?? 3;
    const isPreferred = preferredRecoveryModes.includes("exercise");

    return {
      type: exerciseValue >= 4 || (isPreferred && exerciseValue >= 3) ? "recovery" : "mixed",
      recoveryMode: "exercise",
    };
  }

  if (isSocialEvent(normalized)) {
    const socialBenefit = profile.socialRecoveryValue ?? 3;
    const socialCost = profile.overloadSensitivity ?? 3;
    const isPreferred = preferredRecoveryModes.includes("social");
    const isRestorative =
      (socialBenefit >= 4 && socialCost <= 3) ||
      (isPreferred && socialBenefit >= 3 && socialCost <= 4);

    return {
      type: isRestorative ? "recovery" : "mixed",
      recoveryMode: "social",
    };
  }

  if (isQuietRecoveryEvent(normalized)) {
    const quietValue = profile.quietRecoveryValue ?? 3;
    const isPreferred = preferredRecoveryModes.includes("quiet");

    return {
      type: quietValue >= 4 || (isPreferred && quietValue >= 3) ? "recovery" : "neutral",
      recoveryMode: "quiet",
    };
  }

  if (neutralKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      type: "neutral",
      recoveryMode: null,
    };
  }

  return null;
}

export function inferEventType(
  title: string,
  profile?: Pick<
    Partial<CognitiveProfileSnapshot>,
    | "exerciseRecoveryValue"
    | "socialRecoveryValue"
    | "quietRecoveryValue"
    | "preferredRecoveryModes"
    | "overloadSensitivity"
  > | null,
): EventType {
  return inferProfileEventInterpretation(title, profile)?.type ?? "neutral";
}

export function getDashboardEventInterpretation(
  event: {
    title: string;
    inferredType: EventType;
    userOverrideType?: EventType | null;
  },
  profile?: Pick<
    Partial<CognitiveProfileSnapshot>,
    | "exerciseRecoveryValue"
    | "socialRecoveryValue"
    | "quietRecoveryValue"
    | "preferredRecoveryModes"
    | "overloadSensitivity"
  > | null,
): EventInterpretation {
  const liveInterpretation = inferProfileEventInterpretation(event.title, profile);

  if (event.userOverrideType) {
    return {
      type: event.userOverrideType,
      source: "user_override",
      recoveryMode: liveInterpretation?.recoveryMode ?? null,
    };
  }

  if (liveInterpretation) {
    return {
      ...liveInterpretation,
      source: "live_profile_inference",
    };
  }

  return {
    type: event.inferredType,
    source: "stored_inferred_type",
    recoveryMode: null,
  };
}

export function getEffectiveEventType(
  event: {
    title: string;
    inferredType: EventType;
    userOverrideType?: EventType | null;
  },
  profile?: Pick<
    Partial<CognitiveProfileSnapshot>,
    | "exerciseRecoveryValue"
    | "socialRecoveryValue"
    | "quietRecoveryValue"
    | "preferredRecoveryModes"
    | "overloadSensitivity"
  > | null,
) {
  return getDashboardEventInterpretation(event, profile).type;
}
