import { EVENT_TYPE_LABELS, RECOMMENDATION_TYPE_LABELS, TASK_TYPE_LABELS } from "@/lib/constants";
import type { RecoveryMode } from "@/lib/cognitive-profile";
import type { SubtypeName } from "@/lib/profile-model";

export type EventType = keyof typeof EVENT_TYPE_LABELS;
export type TaskType = keyof typeof TASK_TYPE_LABELS;
export type RecommendationType = keyof typeof RECOMMENDATION_TYPE_LABELS;
export type EventTypeSource = "user_override" | "live_profile_inference" | "stored_inferred_type";
export type WeekEventType =
  | "class"
  | "evaluative"
  | "study_work"
  | "work_meeting"
  | "deep_work"
  | "admin"
  | "social"
  | "exercise"
  | "meal"
  | "appointment"
  | "commute"
  | "travel"
  | "errand"
  | "personal_care"
  | "unknown";
export type ClassificationConfidence = "high" | "medium" | "low";
export type ClassificationSource = "keyword_rule";

export interface WorkProfileSnapshot {
  deepWorkPreference: number;
  fragmentationSensitivity: number;
  socialLoadCost: number;
  ambiguityFriction: number;
  exerciseRecoveryBenefit: number;
  socialRecoveryBenefit: number;
  prefersLongBlocks: boolean;
  underestimatesOpenEndedWork: boolean;
}

export interface CognitiveProfileSnapshot {
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

export interface CalendarEventSnapshot {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  inferredType: EventType;
  userOverrideType?: EventType | null;
}

export interface TaskSnapshot {
  id: string;
  title: string;
  dueAt: Date;
  estimatedHours: number;
  taskType: TaskType;
  projectLabel?: string | null;
  notes?: string | null;
  ambiguityLevel?: number | null;
  emotionalFriction?: number | null;
  requiresUninterruptedBlock: boolean;
  status: "active" | "completed" | "archived";
}

export interface TimeWindow {
  id: string;
  date: Date;
  start: Date;
  end: Date;
  durationMinutes: number;
  quality: "deep" | "medium" | "light";
  demandBlocks: number;
  contextSwitchCount: number;
  adjacentDemandBefore: boolean;
  adjacentDemandAfter: boolean;
  followsWorkoutRecovery: boolean;
  followsSocialLoad: boolean;
  followsQuietRecovery: boolean;
  precedingRecoveryMode?: RecoveryMode | null;
}

export interface RecommendationDraft {
  recommendationType: RecommendationType;
  taskId?: string;
  summary: string;
  explanation: string;
  score: number;
  suggestedStart?: Date;
  suggestedEnd?: Date;
}

export interface WeeklyLoadMetrics {
  scheduledHours: number;
  freeHours: number;
  deepWorkCapableHours: number;
  majorDeadlines: number;
  highFrictionTasks: number;
  recoveryBlockCount: number;
  overloadRiskScore: number;
  deepWorkMismatch: boolean;
  deepWorkMismatchMessage: string;
  highlightedRisks: string[];
  restorativeHighlights: string[];
  recoveryGuidance: string;
}

export interface EphemeralGoogleEvent {
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  durationMinutes: number;
  rawTitle: string;
  sourceKey?: string;
}

export interface ClassifiedWeekEvent {
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  durationMinutes: number;
  eventType: WeekEventType;
  confidence?: ClassificationConfidence;
  classificationSource?: ClassificationSource;
}

export interface WeekShapeSegment {
  kind: "event" | "open";
  startMinute: number;
  endMinute: number;
  eventType?: WeekEventType;
  emphasis?: "focus" | "fragmented";
}

export interface WeekShapeDay {
  label: string;
  date: Date;
  committedMinutes: number;
  focusWindowCount: number;
  fragmentedWindowCount: number;
  segments: WeekShapeSegment[];
}

export interface DailyLoadScore {
  label: string;
  date: Date;
  score: number;
  committedHours: number;
  operatingMode: "absorb" | "protect" | "build" | "recover";
  modeTitle: string;
  modeMeaning: string;
  modeActions: string[];
  modeReframe: string;
}

export interface DailyLoadDebug {
  label: string;
  date: Date;
  demandSubtotal: number;
  evaluativeLoadSubtotal: number;
  latentDemandSubtotal: number;
  anticipatoryExamPressure: number;
  supportSubtotal: number;
  transitionPenalty: number;
  fragmentationPenalty: number;
  compressionPenalty: number;
  openTimeSupport: number;
  accumulationCarryover: number;
  rawScoreBeforeScaling: number;
  finalDisplayScore: number;
}

export interface WeeklyLoadDebug {
  scheduledWeeklyRawScoreBeforeLatent: number;
  evaluativeLoadContribution: number;
  anticipatoryExamContribution: number;
  latentDemandContribution: number;
  summedDailyRawScore: number;
  averageDailyRawScore: number;
  multiDayPatternPenalties: number;
  weeklyAggregationPenalty: number;
  recoveryCredits: number;
  weeklyStabilizingCredits: number;
  supportFactor: number;
  weeklyRawScoreBeforeScaling: number;
  finalWeeklyDisplayScore: number;
}

export interface WeekAnalysisMetrics {
  totalCommittedMinutes: number;
  totalOpenMinutes: number;
  overallLoadScore: number;
  scheduledLoadScore: number;
  latentDemandMinutes: number;
  availableMarginMinutes: number;
  committedHoursByDay: Array<{ label: string; committedHours: number }>;
  dailyLoadScores: DailyLoadScore[];
  dailyLoadDebug: DailyLoadDebug[];
  weeklyLoadDebug: WeeklyLoadDebug;
  freeBlocksByDay: Array<{ label: string; count: number }>;
  medianFreeBlockMinutes: number;
  freeBlockCount30: number;
  freeBlockCount60: number;
  freeBlockCount90: number;
  fragmentationBurden: number;
  protectedBlockAvailability: number;
  loadConcentration: number;
  morningUsableMinutes: number;
  afternoonUsableMinutes: number;
  transitionDensity: number;
  eventTypeCounts: Partial<Record<WeekEventType, number>>;
  externallyStructuredCount: number;
  socialCount: number;
  exerciseCount: number;
  workClassMinutes: number;
  meetingsStructuredMinutes: number;
  socialMinutes: number;
  recoverySoloMinutes: number;
  squeezedOpenBlockCount: number;
  bufferedOpenBlockCount: number;
  weekShapeDays: WeekShapeDay[];
}

export interface WeekAnalysisReportSnapshot {
  analyzedAt: Date;
  expiresAt: Date;
  observations: string[];
  suggestions: string[];
  classifiedEvents: ClassifiedWeekEvent[];
  derivedMetrics: WeekAnalysisMetrics;
}
