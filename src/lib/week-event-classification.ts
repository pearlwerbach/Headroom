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

function containsWordAny(text: string, values: string[]) {
  return values.some((value) => containsWord(text, value));
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
  "shabbat",
  "hillel",
  "beach day",
  "bagel making",
  "coffee at",
  "launch",
];

const MEDICAL_OR_BODY_CARE_MARKERS = [
  "doctor",
  "doctor appt",
  "dentist",
  "orthodontist",
  "therapy",
  "therapist",
  "psychiatrist",
  "meds",
  "medication",
  "pharmacy",
  "pt",
  "physical therapy",
  "wrist pt",
  "haircut",
  "nails",
  "self care",
  "care",
];

const EXCLUDE_NEUTRAL_MARKERS = [
  "no actives",
  "holiday",
  "mother s day",
  "formal classes end",
  "last day of instruction",
  "reminder",
  "pending tasks",
  "water the plants",
  "task sum",
  "birthday reminder",
  "all day",
  "maybe",
  "tentative",
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
        "me vening",
        "me time",
        "evening off",
        "night off",
        "no more work",
        "slow day",
        "solo time",
        "alone time",
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
        "decompression",
        "recharge",
        "recover",
        "recovery",
        "pause",
        "bath",
        "slow morning",
        "sleep in",
        "meditate",
        "meditation",
        "breathwork",
        "journal",
        "journaling",
        "chill",
        "relax",
        "relaxing",
        "unwind",
      ]),
  },
  {
    eventType: "rest",
    confidence: "low",
    matchedRule: "open_buffer_keyword",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "buffer",
        "open time",
        "free time",
        "unscheduled",
        "blank space",
        "catch up block",
        "flex block",
        "floating block",
        "breathing room",
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
        "work out",
        "run",
        "running",
        "walk",
        "walking",
        "climbing",
        "climb",
        "volume day climb",
        "volume day",
        "limit climbing",
        "climbing practice",
        "cal climbing practice",
        "cal climbing",
        "bouldering",
        "uppa body",
        "yoga",
        "restorative yoga",
        "pilates",
        "stretch",
        "stretching",
        "ninja warrior",
        "legs",
        "lower body",
        "leg day",
        "upper body",
        "core",
        "abs",
        "cardio",
        "lifting",
        "lift",
        "hike",
        "hiking",
        "movement",
        "exercise",
        "training",
        "mobility",
        "swim",
        "swimming",
        "bike",
        "biking",
        "cycle",
        "cycling",
        "dance",
        "fitness",
        "stadium fitness",
      ]),
  },
  {
    eventType: "exercise",
    confidence: "medium",
    matchedRule: "practice_sport_phrase",
    matches: ({ combinedText }) =>
      containsWord(combinedText, "practice") &&
      containsAny(combinedText, ["climb", "climbing", "gym", "sport", "workout", "cal climbing"]),
  },
];

const MEAL_CARE_RULES: ClassificationRule[] = [
  {
    eventType: "meal",
    confidence: "medium",
    matchedRule: "meal_keyword",
    matches: ({ combinedText }) =>
      !containsAny(combinedText, ["bagel making", "coffee at", "coffee with", "eon coffee"]) &&
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
        "prep food",
        "grab dinner",
        "quick brekky",
        "coffee",
        "tea",
        "teatime",
        "boba",
        "smoothie",
        "snacks",
        "bagel",
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
        "therapist",
        "psychiatrist",
        "pt",
        "physical therapy",
        "wrist pt",
        "dentist",
        "orthodontist",
        "meds",
        "medication",
        "haircut",
        "nails",
        "laundry",
        "cook",
        "cooking",
        "clean room",
        "cleaning",
        "sleep in",
        "slow morning",
        "home reset",
        "self care",
        "care",
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
      containsWord(combinedText, "coffee") &&
      !containsAny(combinedText, ["coffee at", "coffee with", "eon coffee"]) &&
      !containsAny(combinedText, SOCIAL_SUPPORT_MARKERS),
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
        "tea with",
        "dinner with",
        "lunch with",
        "brunch with",
        "with sheri",
        "board game",
        "game night",
        "wine night",
        "shabbat",
        "beach day",
        "beach",
        "bagel making",
        "coffee at",
        "eon coffee",
        "party",
        "event with",
      ]) ||
      (containsWord(combinedText, "coffee") && containsWord(combinedText, "at")),
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
        "show",
        "movie",
        "adventure",
        "hillel",
        "launch",
        "opening",
        "community",
        "gathering",
        "club",
        "clubbing",
        "bar",
        "thunderdome",
        "rites of spring",
        "saisha",
        "lana",
        "everett",
        "maya",
        "sheri",
      ]),
  },
];

const EXCLUDE_RULES: ClassificationRule[] = [
  {
    eventType: "unknown",
    confidence: "medium",
    matchedRule: "exclude_neutral_keyword",
    matches: ({ combinedText }) => containsAny(combinedText, EXCLUDE_NEUTRAL_MARKERS),
  },
];

const ACADEMIC_RULES: ClassificationRule[] = [
  {
    eventType: "evaluative",
    confidence: "high",
    matchedRule: "evaluative_phrase",
    matches: ({ combinedText }) =>
      containsAny(combinedText, ["final exam", "midterm exam", "take home final", "oral exam", "practice exam"]),
  },
  {
    eventType: "evaluative",
    confidence: "medium",
    matchedRule: "evaluative_keyword",
    matches: ({ combinedText }) =>
      containsWordAny(combinedText, ["exam", "midterm", "final", "finals", "quiz", "test", "assessment"]),
  },
  {
    eventType: "class",
    confidence: "medium",
    matchedRule: "class_keyword",
    matches: ({ titleAndCalendar, combinedText }) =>
      !containsAny(combinedText, ["symposium", "talk", "chat", "workshop", "panel", "info session"]) &&
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
        "problem set",
        "pset",
        "assignment",
        "paper",
        "essay",
        "report",
        "writeup",
        "prelab",
        "postlab",
        "class notes",
        "practice questions",
        "drill",
        "tutor",
        "tutoring",
        "prep",
        "physics",
        "bio",
        "bio 1a",
        "bio 1al",
        "data",
        "data 89",
        "data 8",
        "chem",
        "math",
        "neuro",
        "psych",
        "gws",
        "physicsss",
        "psysci",
        "do physics",
        "manuscript",
        "poster",
        "urap",
        "research",
        "data supervision",
        "data meeting",
        "redcap",
        "qc",
        "analysis",
        "coding",
        "debug",
        "conference abstract",
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
        "problem set",
        "pset",
        "practice questions",
        "notes",
        "class notes",
      ]),
  },
  {
    eventType: "deep_work",
    confidence: "medium",
    matchedRule: "deep_work_keyword",
    matches: ({ titleAndCalendar, combinedText }) =>
      !containsAny(combinedText, ["meeting", "meet", "symposium", "talk", "chat", "workshop", "panel", "session"]) &&
      containsAny(titleAndCalendar, [
        "project work",
        "deep work",
        "write",
        "writing",
        "research",
        "draft",
        "focus",
        "project",
        "proposal",
        "presentation",
        "slides",
        "manuscript",
        "poster",
        "analysis",
        "coding",
        "debug",
        "application",
        "resume",
        "cv",
        "cover letter",
        "interview prep",
      ]),
  },
  {
    eventType: "admin",
    confidence: "medium",
    matchedRule: "admin_keyword",
    matches: ({ titleAndCalendar, normalizedTitle }) =>
      normalizedTitle === "planning" ||
      containsAny(titleAndCalendar, [
        "admin",
        "email",
        "emails",
        "inbox",
        "paperwork",
        "forms",
        "registration",
        "send out",
      ]),
  },
];

const STRUCTURED_RULES: ClassificationRule[] = [
  {
    eventType: "work_meeting",
    confidence: "high",
    matchedRule: "meeting_phrase",
    matches: ({ combinedText }) =>
      containsAny(combinedText, [
        "meet with",
        "job offer negotiation",
        "phone call",
        "check in",
        "check in",
      ]),
  },
  {
    eventType: "work_meeting",
    confidence: "high",
    matchedRule: "work_meeting_phrase",
    matches: ({ combinedText, normalizedTitle }) =>
      normalizedTitle === "planning meeting" ||
      containsAny(combinedText, [
        "one on one",
        "1 1",
        "check in",
        "check-in",
        "staff meeting",
        "planning meeting",
        "office hours",
        "lab meeting",
        "info session",
      ]),
  },
  {
    eventType: "work_meeting",
    confidence: "medium",
    matchedRule: "work_meeting_keyword",
    matches: ({ titleAndCalendar }) =>
      containsAny(titleAndCalendar, [
        "meeting",
        "meet",
        "sync",
        "standup",
        "committee",
        "supervision",
        "team meet",
        "benchmark practice",
        "benchmark practices",
        "symposium",
        "talk",
        "chat",
        "seminar",
        "workshop",
        "lecture",
        "negotiation",
        "call",
        "zoom",
        "consult",
        "consultation",
        "interview",
        "orientation",
        "training",
        "info session",
        "session",
        "mandatory",
        "must attend",
        "must go",
        "shift",
        "work shift",
        "bartending",
        "volunteer",
        "volunteering",
        "tabling",
        "table",
        "event",
      ]),
  },
  {
    eventType: "appointment",
    confidence: "medium",
    matchedRule: "appointment_keyword",
    matches: ({ titleAndCalendar, combinedText }) =>
      !containsAny(combinedText, MEDICAL_OR_BODY_CARE_MARKERS) &&
      containsAny(titleAndCalendar, ["advising", "appointment", "appt", "consultation"]),
  },
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
      containsWordAny(combinedText, ["commute", "drive", "bart", "train", "bus", "flight", "airport", "uber", "lyft", "travel"]) ||
      containsAny(combinedText, ["walk to", "drive back"]),
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

  for (const rule of EXCLUDE_RULES) {
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

  for (const rule of ACADEMIC_RULES) {
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

  for (const rule of STRUCTURED_RULES) {
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
