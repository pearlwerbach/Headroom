import type {
  ClassifiedWeekEvent,
  ClassificationConfidence,
  ClassificationSource,
  TrajectoryLoadCategory,
  WeekEventType,
} from "@/lib/domain";

export type WeekCompositionCategory =
  | "work_class"
  | "meetings_structured"
  | "social"
  | "recovery_solo";

export type RecoveryCategory =
  | "exercise"
  | "social"
  | "care"
  | "rest"
  | "open";

export interface WeekEventClassificationInput {
  title: string;
  description?: string | null;
  sourceCalendarId?: string | null;
}

export interface CanonicalWeekEventInput extends WeekEventClassificationInput {
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  rangeStart: Date;
  rangeEnd: Date;
}

export interface ClassifiedWeekEventKind {
  eventType: WeekEventType;
  confidence: ClassificationConfidence;
  classificationSource: ClassificationSource;
  matchedRule?: string;
  normalizedTitle?: string;
}

interface ClassificationContext {
  normalizedTitle: string;
  normalizedDescription: string;
  normalizedCalendar: string;
  combinedText: string;
  titleAndCalendar: string;
}

interface ClassificationRule {
  eventType: WeekEventType;
  confidence: ClassificationConfidence;
  matchedRule: string;
  matches: (context: ClassificationContext) => boolean;
}

function containsAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function containsWord(text: string, value: string) {
  return text.split(" ").includes(value);
}

export function normalizeEventText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildClassificationContext(input: WeekEventClassificationInput): ClassificationContext {
  const normalizedTitle = normalizeEventText(input.title);
  const normalizedDescription = normalizeEventText(input.description ?? "");
  const normalizedCalendar = normalizeEventText(input.sourceCalendarId ?? "");

  return {
    normalizedTitle,
    normalizedDescription,
    normalizedCalendar,
    combinedText: [normalizedTitle, normalizedDescription, normalizedCalendar].filter(Boolean).join(" "),
    titleAndCalendar: [normalizedTitle, normalizedCalendar].filter(Boolean).join(" "),
  };
}

const SOCIAL_SUPPORT_MARKERS = [
  "friend",
  "family",
  "roommate",
  "partner",
  "with ",
  "support group",
  "catch up",
  "hang",
  "hangout",
  "coffee with",
  "call with",
  "adventure",
  "board game",
  "wine night",
  "concert",
  "bday",
  "birthday",
];

const EXPLICIT_REST_RULES: ClassificationRule[] = [
  {
    eventType: "rest",
    confidence: "high",
    matchedRule: "rest_phrase",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "quiet time",
        "take a break",
        "rest day",
        "reading for fun",
      ]),
  },
  {
    eventType: "rest",
    confidence: "medium",
    matchedRule: "rest_keyword",
    matches: ({ combinedText }) =>
      !containsAny(combinedText, ["lunch", "dinner", "breakfast", "meal", "brunch"]) &&
      containsAny(combinedText, [
        "nap",
        "rest",
        "break",
        "reset",
        "decompress",
        "recharge",
        "bath",
        "unwind",
      ]),
  },
];

const EXERCISE_RULES: ClassificationRule[] = [
  {
    eventType: "exercise",
    confidence: "medium",
    matchedRule: "exercise_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "gym",
        "workout",
        "run",
        "walk",
        "climbing",
        "climb",
        "volume day climb",
        "climbing practice",
        "cal climbing practice",
        "yoga",
        "pilates",
        "stretch",
        "legs",
        "upper body",
        "core",
        "lifting",
        "hike",
        "movement",
        "exercise",
        "training",
      ]),
  },
];

const MEAL_CARE_RULES: ClassificationRule[] = [
  {
    eventType: "meal",
    confidence: "medium",
    matchedRule: "meal_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "lunch",
        "lunch break",
        "dinner",
        "din din",
        "breakfast",
        "brekky",
        "meal",
        "eat",
        "food",
        "brunch",
        "meal prep",
        "grab dinner",
        "quick brekky",
      ]),
  },
  {
    eventType: "personal_care",
    confidence: "medium",
    matchedRule: "care_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "shower",
        "skincare",
        "doctor",
        "therapy",
        "pt",
        "physical therapy",
        "wrist pt",
        "medication",
        "haircut",
        "laundry",
        "cook",
        "cooking",
      ]),
  },
  {
    eventType: "errand",
    confidence: "medium",
    matchedRule: "care_logistics_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "groceries",
        "grocery",
        "pharmacy",
      ]),
  },
  {
    eventType: "meal",
    confidence: "low",
    matchedRule: "coffee_nourishment_keyword",
    matches: ({ combinedText }) =>
      containsWord(combinedText, "coffee") && !containsAny(combinedText, SOCIAL_SUPPORT_MARKERS),
  },
];

const SOCIAL_RULES: ClassificationRule[] = [
  {
    eventType: "social",
    confidence: "high",
    matchedRule: "social_phrase",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "friend hang",
        "family call",
        "social time",
        "roommate time",
        "partner time",
        "support group",
        "coffee with",
        "with sheri",
        "board game",
        "wine night",
      ]),
  },
  {
    eventType: "social",
    confidence: "medium",
    matchedRule: "social_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "catch up",
        "hang",
        "hangout",
        "birthday",
        "bday",
        "party",
        "drinks",
        "social",
        "concert",
        "adventure",
      ]),
  },
];

const WORKLIKE_RULES: ClassificationRule[] = [
  {
    eventType: "travel",
    confidence: "medium",
    matchedRule: "travel_keyword",
    matches: ({ combinedText }) => containsAny(combinedText, ["flight", "airport", "hotel", "travel"]),
  },
  {
    eventType: "commute",
    confidence: "medium",
    matchedRule: "commute_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, ["commute", "drive", "bart", "train", "bus", "transit", "shuttle"]),
  },
  {
    eventType: "evaluative",
    confidence: "high",
    matchedRule: "evaluative_phrase",
    matches: ({ combinedText }) =>
      containsAny(combinedText, ["final exam", "midterm exam", "take home final", "oral exam"]),
  },
  {
    eventType: "evaluative",
    confidence: "medium",
    matchedRule: "evaluative_keyword",
    matches: ({ combinedText }) => containsAny(combinedText, ["exam", "midterm", "final", "finals", "quiz", "test"]),
  },
  {
    eventType: "class",
    confidence: "medium",
    matchedRule: "class_keyword",
    matches: ({ titleAndCalendar }) =>
      containsAny(titleAndCalendar, [
        "class",
        "lecture",
        "seminar",
        "section",
        "discussion",
        "lab",
        "recitation",
        "office hours",
        "ohs",
        "physics",
        "physicsss",
        "psysci",
      ]),
  },
  {
    eventType: "work_meeting",
    confidence: "high",
    matchedRule: "work_meeting_phrase",
    matches: ({ combinedText, normalizedTitle }) =>
      normalizedTitle === "planning meeting" ||
      containsAny(combinedText, ["one on one", "1 1", "check in", "check-in", "staff meeting", "planning meeting"]),
  },
  {
    eventType: "work_meeting",
    confidence: "medium",
    matchedRule: "work_meeting_keyword",
    matches: ({ titleAndCalendar }) =>
      containsAny(titleAndCalendar, [
        "meeting",
        "sync",
        "standup",
        "presentation",
        "committee",
        "supervision",
        "team meet",
        "benchmark practice",
        "benchmark practices",
      ]),
  },
  {
    eventType: "study_work",
    confidence: "medium",
    matchedRule: "study_keyword",
    matches: ({ titleAndCalendar }) =>
      containsAny(titleAndCalendar, [
        "study",
        "studying",
        "review",
        "homework",
        "prep",
        "submit",
        "finish",
        "complete",
        "read",
        "reading",
        "readings",
      ]),
  },
  {
    eventType: "deep_work",
    confidence: "medium",
    matchedRule: "deep_work_keyword",
    matches: ({ titleAndCalendar }) =>
      containsAny(titleAndCalendar, ["project work", "deep work", "write", "writing", "research", "draft", "focus"]),
  },
  {
    eventType: "admin",
    confidence: "medium",
    matchedRule: "admin_keyword",
    matches: ({ titleAndCalendar, normalizedTitle }) =>
      normalizedTitle === "planning" ||
      containsAny(titleAndCalendar, ["admin", "email", "inbox", "paperwork", "forms", "registration"]),
  },
  {
    eventType: "appointment",
    confidence: "medium",
    matchedRule: "appointment_keyword",
    matches: ({ titleAndCalendar }) => containsAny(titleAndCalendar, ["advising", "appointment", "consultation"]),
  },
];

export function classifyWeekEvent(input: WeekEventClassificationInput): ClassifiedWeekEventKind {
  const context = buildClassificationContext(input);

  if (!context.normalizedTitle) {
    return {
      eventType: "unknown",
      confidence: "low",
      classificationSource: "keyword_rule",
      matchedRule: "empty_title",
      normalizedTitle: "",
    };
  }

  for (const rule of WORKLIKE_RULES) {
    if (rule.matches(context)) {
      return {
        eventType: rule.eventType,
        confidence: rule.confidence,
        classificationSource: "keyword_rule",
        matchedRule: rule.matchedRule,
        normalizedTitle: context.normalizedTitle,
      };
    }
  }

  for (const rule of EXERCISE_RULES) {
    if (rule.matches(context)) {
      return {
        eventType: rule.eventType,
        confidence: rule.confidence,
        classificationSource: "keyword_rule",
        matchedRule: rule.matchedRule,
        normalizedTitle: context.normalizedTitle,
      };
    }
  }

  for (const rule of EXPLICIT_REST_RULES) {
    if (rule.matches(context)) {
      return {
        eventType: rule.eventType,
        confidence: rule.confidence,
        classificationSource: "keyword_rule",
        matchedRule: rule.matchedRule,
        normalizedTitle: context.normalizedTitle,
      };
    }
  }

  for (const rule of MEAL_CARE_RULES) {
    if (rule.matches(context)) {
      return {
        eventType: rule.eventType,
        confidence: rule.confidence,
        classificationSource: "keyword_rule",
        matchedRule: rule.matchedRule,
        normalizedTitle: context.normalizedTitle,
      };
    }
  }

  for (const rule of SOCIAL_RULES) {
    if (rule.matches(context)) {
      return {
        eventType: rule.eventType,
        confidence: rule.confidence,
        classificationSource: "keyword_rule",
        matchedRule: rule.matchedRule,
        normalizedTitle: context.normalizedTitle,
      };
    }
  }

  return {
    eventType: "unknown",
    confidence: "low",
    classificationSource: "keyword_rule",
    matchedRule: "no_match",
    normalizedTitle: context.normalizedTitle,
  };
}

export function classifyWeekEventTitle(title: string): ClassifiedWeekEventKind {
  return classifyWeekEvent({ title });
}

export function resolveCompositionCategory(
  eventType: WeekEventType,
): WeekCompositionCategory | null {
  switch (eventType) {
    case "evaluative":
    case "class":
    case "study_work":
    case "deep_work":
    case "admin":
      return "work_class";
    case "work_meeting":
    case "appointment":
    case "commute":
    case "travel":
      return "meetings_structured";
    case "social":
      return "social";
    case "exercise":
    case "rest":
    case "meal":
    case "personal_care":
    case "errand":
      return "recovery_solo";
    case "unknown":
    default:
      return null;
  }
}

export function resolveRecoveryCategory(
  eventType: WeekEventType,
): RecoveryCategory | null {
  switch (eventType) {
    case "exercise":
      return "exercise";
    case "social":
      return "social";
    case "meal":
    case "personal_care":
    case "errand":
      return "care";
    case "rest":
      return "rest";
    default:
      return null;
  }
}

export function resolveTrajectoryLoadCategory(
  eventType: WeekEventType,
): TrajectoryLoadCategory {
  switch (eventType) {
    case "class":
    case "evaluative":
    case "study_work":
    case "deep_work":
    case "admin":
      return "demand";
    case "work_meeting":
    case "appointment":
    case "commute":
    case "travel":
      return "structured";
    case "social":
      return "social";
    case "exercise":
    case "rest":
    case "meal":
    case "personal_care":
    case "errand":
      return "support";
    case "unknown":
    default:
      return "neutral";
  }
}

function clipToRange(startTime: Date, endTime: Date, rangeStart: Date, rangeEnd: Date) {
  const clippedStart = startTime < rangeStart ? rangeStart : startTime;
  const clippedEnd = endTime > rangeEnd ? rangeEnd : endTime;

  if (clippedEnd <= clippedStart) {
    return null;
  }

  return {
    clippedStart,
    clippedEnd,
  };
}

function isAllDayLikeEvent(input: CanonicalWeekEventInput) {
  const rawDurationHours = (input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60);
  const startsAtMidnight =
    input.startTime.getHours() === 0 &&
    input.startTime.getMinutes() === 0 &&
    input.endTime.getHours() === 0 &&
    input.endTime.getMinutes() === 0;

  return input.allDay || startsAtMidnight || Math.abs(rawDurationHours - 24) < 0.05;
}

function isTrueAllDayCommitment(normalizedTitle: string, eventType: WeekEventType) {
  if (eventType === "travel") {
    return true;
  }

  return containsAny(normalizedTitle, [
    "travel day",
    "conference",
    "retreat",
    "wedding",
    "trip",
    "festival",
    "shift",
  ]);
}

function isSymbolicTrajectoryMarker(eventType: WeekEventType) {
  return (
    eventType === "class" ||
    eventType === "evaluative" ||
    eventType === "study_work" ||
    eventType === "deep_work" ||
    eventType === "admin"
  );
}

export function buildCanonicalClassifiedWeekEvent(
  input: CanonicalWeekEventInput,
): ClassifiedWeekEvent | null {
  const classification = classifyWeekEvent(input);
  const clipped = clipToRange(input.startTime, input.endTime, input.rangeStart, input.rangeEnd);

  if (!clipped) {
    return null;
  }

  const rawDurationHours = Math.max(0, (input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60));
  const clippedDurationHours = Math.max(
    0,
    (clipped.clippedEnd.getTime() - clipped.clippedStart.getTime()) / (1000 * 60 * 60),
  );
  const isAllDayLike = isAllDayLikeEvent(input);
  const compositionCategory = resolveCompositionCategory(classification.eventType);
  const recoveryCategory = resolveRecoveryCategory(classification.eventType);
  const trajectoryLoadCategory = resolveTrajectoryLoadCategory(classification.eventType);
  const trueAllDayCommitment =
    isAllDayLike && isTrueAllDayCommitment(classification.normalizedTitle ?? "", classification.eventType);
  const countedDurationHours =
    isAllDayLike && !trueAllDayCommitment
      ? 0
      : clippedDurationHours;
  const includeInTrajectory =
    countedDurationHours > 0 ||
    (isAllDayLike && !trueAllDayCommitment && isSymbolicTrajectoryMarker(classification.eventType));

  return {
    title: input.title,
    normalizedTitle: classification.normalizedTitle ?? normalizeEventText(input.title),
    startTime: input.startTime,
    endTime: input.endTime,
    clippedStartTime: clipped.clippedStart,
    clippedEndTime: clipped.clippedEnd,
    allDay: input.allDay,
    isAllDayLike,
    durationMinutes: Math.round(countedDurationHours * 60),
    rawDurationHours: Math.round(rawDurationHours * 100) / 100,
    countedDurationHours: Math.round(countedDurationHours * 100) / 100,
    eventType: classification.eventType,
    compositionCategory,
    recoveryCategory,
    trajectoryLoadCategory,
    matchedRule: classification.matchedRule,
    sourceCalendar: input.sourceCalendarId ?? "unknown",
    sourceCalendarId: input.sourceCalendarId ?? undefined,
    includeInComposition: compositionCategory !== null && countedDurationHours > 0,
    includeInRecoveryIslands: recoveryCategory !== null && countedDurationHours > 0,
    includeInTrajectory,
    confidence: classification.confidence,
    classificationSource: classification.classificationSource,
  };
}
