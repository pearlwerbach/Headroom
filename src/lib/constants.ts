export const APP_NAME = "HEADROOM";
export const QUIZ_VERSION = "explicit-question-set-v1";
export const PROFILE_MODEL_VERSION = "v1";
export const DEFAULT_WAKE_HOUR = 7;
export const DEFAULT_SLEEP_HOUR = 23;
export const CALENDAR_SYNC_DAYS = 14;
export const DASHBOARD_DAYS = 7;
export const WEEK_ANALYSIS_CACHE_HOURS = 24;

export const EVENT_TYPE_LABELS = {
  demand: "Demand",
  recovery: "Recovery",
  neutral: "Neutral",
  mixed: "Mixed",
} as const;

export const TASK_TYPE_LABELS = {
  deep_work: "Deep Work",
  problem_solving: "Problem Solving",
  reading: "Reading",
  writing: "Writing",
  admin: "Admin",
  social_interpersonal: "Social / Interpersonal",
  errands_logistics: "Errands / Logistics",
} as const;

export const RECOMMENDATION_TYPE_LABELS = {
  today_focus: "Today focus",
  start_early: "Start early",
  fragmented_fit: "Fragmented fit",
  overload_warning: "Overload warning",
  recovery_note: "Recovery note",
  deep_work_shortage: "Deep-work shortage",
} as const;
