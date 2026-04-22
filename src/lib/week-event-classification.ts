import type {
  ClassificationConfidence,
  ClassificationSource,
  WeekEventType,
} from "@/lib/domain";

export interface ClassifiedWeekEventKind {
  eventType: WeekEventType;
  confidence: ClassificationConfidence;
  classificationSource: ClassificationSource;
}

const CATEGORY_PATTERNS: Array<{
  eventType: WeekEventType;
  phrases?: string[];
  keywords?: string[];
}> = [
  {
    eventType: "travel",
    keywords: ["flight", "airport", "hotel", "travel"],
  },
  {
    eventType: "commute",
    keywords: ["commute", "drive", "bart", "train", "bus", "transit", "shuttle"],
  },
  {
    eventType: "appointment",
    keywords: ["doctor", "dentist", "therapy", "advising", "appointment", "consultation"],
  },
  {
    eventType: "evaluative",
    phrases: ["final exam", "midterm exam", "take home final", "oral exam"],
    keywords: ["exam", "midterm", "final", "finals", "quiz", "test"],
  },
  {
    eventType: "class",
    keywords: ["class", "lecture", "seminar", "section", "discussion", "lab", "recitation", "office hours"],
  },
  {
    eventType: "study_work",
    keywords: [
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
    ],
  },
  {
    eventType: "exercise",
    keywords: ["gym", "workout", "climb", "climbing", "yoga", "run", "pilates", "training", "exercise"],
  },
  {
    eventType: "errand",
    keywords: ["groceries", "grocery", "shopping", "pickup", "pick up", "errand", "bank", "pharmacy"],
  },
  {
    eventType: "personal_care",
    keywords: ["shower", "self care", "skincare", "haircut", "salon"],
  },
  {
    eventType: "social",
    phrases: ["lunch with", "dinner with", "coffee with", "catch up", "date", "party"],
    keywords: ["drinks", "birthday", "hang", "event", "social"],
  },
  {
    eventType: "meal",
    keywords: ["breakfast", "brunch", "lunch", "dinner", "coffee"],
  },
  {
    eventType: "work_meeting",
    phrases: ["one on one", "1 1", "check in", "check-in"],
    keywords: ["meeting", "sync", "standup", "review", "1:1", "planning", "presentation"],
  },
  {
    eventType: "admin",
    keywords: ["admin", "email", "inbox", "planning", "paperwork", "forms", "registration"],
  },
  {
    eventType: "deep_work",
    phrases: ["project work", "deep work"],
    keywords: ["write", "writing", "research", "draft", "focus"],
  },
];

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

export function classifyWeekEventTitle(title: string): ClassifiedWeekEventKind {
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedTitle) {
    return {
      eventType: "unknown",
      confidence: "low",
      classificationSource: "keyword_rule",
    };
  }

  const hasMeetingMarker = includesAny(normalizedTitle, [
    "meeting",
    "sync",
    "standup",
    "review",
    "1 1",
    "1:1",
    "one on one",
    "check in",
    "check-in",
    "presentation",
  ]);

  if (normalizedTitle === "planning") {
    return {
      eventType: "admin",
      confidence: "medium",
      classificationSource: "keyword_rule",
    };
  }

  if (normalizedTitle.includes("planning") && hasMeetingMarker) {
    return {
      eventType: "work_meeting",
      confidence: "high",
      classificationSource: "keyword_rule",
    };
  }

  for (const category of CATEGORY_PATTERNS) {
    if (category.phrases && includesAny(normalizedTitle, category.phrases)) {
      return {
        eventType: category.eventType,
        confidence: "high",
        classificationSource: "keyword_rule",
      };
    }

    if (category.keywords && includesAny(normalizedTitle, category.keywords)) {
      return {
        eventType: category.eventType,
        confidence: category.eventType === "unknown" ? "low" : "medium",
        classificationSource: "keyword_rule",
      };
    }
  }

  return {
    eventType: "unknown",
    confidence: "low",
    classificationSource: "keyword_rule",
  };
}
