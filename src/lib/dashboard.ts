import { RecommendationType, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getLegacyCognitiveProfileFallback,
  getPlanningReadyCognitiveProfile,
} from "@/lib/cognitive-profile";
import { getDashboardEventInterpretation } from "@/lib/calendar";
import { generateRecommendationDrafts } from "@/lib/recommendations";
import type {
  CalendarEventSnapshot,
  CognitiveProfileSnapshot,
  RecommendationDraft,
  TaskSnapshot,
} from "@/lib/domain";
import { startOfLocalDay } from "@/lib/utils";

type WorkProfileRow = NonNullable<Awaited<ReturnType<typeof prisma.workProfile.findFirst>>>;

const CANONICAL_PROFILE_KEYS = [
  "overloadSensitivity",
  "fragmentationCost",
  "transitionCost",
  "deepWorkCapacity",
  "ambiguityTolerance",
  "routinePreference",
  "socialRecoveryValue",
  "exerciseRecoveryValue",
  "quietRecoveryValue",
  "overcommitmentRisk",
] as const;

const SCORING_STATE_KEYS = [
  "blockNeed",
  "fragmentationCost",
  "switchingCost",
  "setupLoad",
  "socialSpillover",
  "passiveReset",
  "socialReset",
  "physicalReset",
  "overcommitmentRisk",
] as const;

function normalizePlanningProfile(
  profile: WorkProfileRow,
) {
  return getPlanningReadyCognitiveProfile(profile);
}

function hasStoredCanonicalProfile(profile: WorkProfileRow) {
  return CANONICAL_PROFILE_KEYS.every((key) => typeof profile[key] === "number");
}

function hasStoredScoringState(profile: WorkProfileRow) {
  return SCORING_STATE_KEYS.every((key) => typeof profile[key] === "number");
}

function getProfileSource(
  profile: WorkProfileRow,
  normalizedProfile: CognitiveProfileSnapshot | null,
  legacyProfileFallback: ReturnType<typeof getLegacyCognitiveProfileFallback>,
) {
  if (normalizedProfile && hasStoredCanonicalProfile(profile)) {
    return "live_canonical_profile";
  }

  if (normalizedProfile && hasStoredScoringState(profile)) {
    return "stored_scoring_state_projection";
  }

  if (legacyProfileFallback) {
    return "legacy_compatibility_adapter";
  }

  return "none";
}

function summarizeDraftOutput(
  output: ReturnType<typeof generateRecommendationDrafts>,
) {
  return {
    overloadRiskScore: output.metrics.overloadRiskScore,
    recommendationTypes: output.drafts.map((draft) => draft.recommendationType),
    recommendationSummaries: output.drafts.map((draft) => draft.summary),
    highlightedRisks: output.metrics.highlightedRisks,
  };
}

function hasMeaningfulDifference(
  left: ReturnType<typeof summarizeDraftOutput>,
  right: ReturnType<typeof summarizeDraftOutput>,
) {
  return JSON.stringify(left) !== JSON.stringify(right);
}

function analyzeProfileImpact(
  events: CalendarEventSnapshot[],
  tasks: TaskSnapshot[],
  profile: CognitiveProfileSnapshot,
) {
  const base = summarizeDraftOutput(generateRecommendationDrafts(events, tasks, profile));
  const probes = [
    { key: "fragmentationCost" as const, low: 1, high: 5 },
    { key: "transitionCost" as const, low: 1, high: 5 },
    { key: "quietRecoveryValue" as const, low: 1, high: 5 },
  ];

  const numericImpact = Object.fromEntries(
    probes.map(({ key, low, high }) => {
      const lowVariant = summarizeDraftOutput(
        generateRecommendationDrafts(events, tasks, { ...profile, [key]: low }),
      );
      const highVariant = summarizeDraftOutput(
        generateRecommendationDrafts(events, tasks, { ...profile, [key]: high }),
      );

      return [
        key,
        {
          currentValue: profile[key],
          lowScenarioValue: low,
          highScenarioValue: high,
          lowScenarioChangesOutput: hasMeaningfulDifference(base, lowVariant),
          highScenarioChangesOutput: hasMeaningfulDifference(base, highVariant),
          affectsWeeklyLoadScore:
            lowVariant.overloadRiskScore !== base.overloadRiskScore ||
            highVariant.overloadRiskScore !== base.overloadRiskScore,
          affectsHighlightedRisks:
            JSON.stringify(lowVariant.highlightedRisks) !==
              JSON.stringify(base.highlightedRisks) ||
            JSON.stringify(highVariant.highlightedRisks) !==
              JSON.stringify(base.highlightedRisks),
          affectsRecommendationContent:
            JSON.stringify(lowVariant.recommendationSummaries) !==
              JSON.stringify(base.recommendationSummaries) ||
            JSON.stringify(highVariant.recommendationSummaries) !==
              JSON.stringify(base.recommendationSummaries),
        },
      ];
    }),
  );

  const recoveryModeVariant = summarizeDraftOutput(
    generateRecommendationDrafts(events, tasks, {
      ...profile,
      preferredRecoveryModes: ["quiet"],
    }),
  );

  return {
    currentOutput: base,
    probes: {
      ...numericImpact,
      preferredRecoveryModes: {
        currentValue: profile.preferredRecoveryModes,
        testScenarioValue: ["quiet"],
        changesOutput: hasMeaningfulDifference(base, recoveryModeVariant),
        affectsWeeklyLoadScore: recoveryModeVariant.overloadRiskScore !== base.overloadRiskScore,
        affectsHighlightedRisks:
          JSON.stringify(recoveryModeVariant.highlightedRisks) !==
          JSON.stringify(base.highlightedRisks),
        affectsRecommendationContent:
          JSON.stringify(recoveryModeVariant.recommendationSummaries) !==
          JSON.stringify(base.recommendationSummaries),
      },
    },
  };
}

function buildDashboardDebug(
  profile: WorkProfileRow,
  normalizedProfile: CognitiveProfileSnapshot | null,
  legacyProfileFallback: ReturnType<typeof getLegacyCognitiveProfileFallback>,
  events: CalendarEventSnapshot[],
  tasks: TaskSnapshot[],
) {
  const profileSource = getProfileSource(profile, normalizedProfile, legacyProfileFallback);
  const interpretedEvents = normalizedProfile
    ? events.map((event) => ({
        id: event.id,
        title: event.title,
        ...getDashboardEventInterpretation(event, normalizedProfile),
      }))
    : [];
  const canonicalVariables = normalizedProfile
    ? {
        overloadSensitivity: normalizedProfile.overloadSensitivity,
        fragmentationCost: normalizedProfile.fragmentationCost,
        transitionCost: normalizedProfile.transitionCost,
        deepWorkCapacity: normalizedProfile.deepWorkCapacity,
        ambiguityTolerance: normalizedProfile.ambiguityTolerance,
        routinePreference: normalizedProfile.routinePreference,
        socialRecoveryValue: normalizedProfile.socialRecoveryValue,
        exerciseRecoveryValue: normalizedProfile.exerciseRecoveryValue,
        quietRecoveryValue: normalizedProfile.quietRecoveryValue,
        overcommitmentRisk: normalizedProfile.overcommitmentRisk,
        preferredRecoveryModes: normalizedProfile.preferredRecoveryModes,
      }
    : null;

  return {
    loadedProfile: {
      id: profile.id,
      updatedAt: profile.updatedAt.toISOString(),
      subtypeName: profile.subtypeName,
      profileSource,
      canonicalVariables,
    },
    stages: {
      loadScoring: normalizedProfile
        ? {
            source: profileSource,
            inputs: {
              fragmentationCost: normalizedProfile.fragmentationCost,
              deepWorkCapacity: normalizedProfile.deepWorkCapacity,
              transitionCost: normalizedProfile.transitionCost,
              overloadSensitivity: normalizedProfile.overloadSensitivity,
              overcommitmentRisk: normalizedProfile.overcommitmentRisk,
            },
            usingFallbackDefaults: [],
            compatibilityAdapter: profileSource === "legacy_compatibility_adapter",
            hardcodedNeutralAssumptions: [],
            ignoredCanonicalFields: [
              "ambiguityTolerance",
              "routinePreference",
              "socialRecoveryValue",
              "exerciseRecoveryValue",
              "preferredRecoveryModes",
            ],
          }
        : {
            source: legacyProfileFallback ? "legacy_compatibility_adapter" : "none",
            inputs: null,
            usingFallbackDefaults: ["no planning-ready canonical profile available"],
            compatibilityAdapter: Boolean(legacyProfileFallback),
            hardcodedNeutralAssumptions: [],
          },
      recommendationGeneration: normalizedProfile
        ? {
            source: profileSource,
            inputs: {
              fragmentationCost: normalizedProfile.fragmentationCost,
              transitionCost: normalizedProfile.transitionCost,
              quietRecoveryValue: normalizedProfile.quietRecoveryValue,
              preferredRecoveryModes: normalizedProfile.preferredRecoveryModes,
            },
            usingFallbackDefaults: [],
            compatibilityAdapter: profileSource === "legacy_compatibility_adapter",
            hardcodedNeutralAssumptions: [],
            ignoredCanonicalFields: [
              "deepWorkCapacity",
              "ambiguityTolerance",
              "overloadSensitivity",
              "exerciseRecoveryValue",
              "overcommitmentRisk",
              "routinePreference",
              "socialRecoveryValue",
            ],
          }
        : {
            source: legacyProfileFallback ? "legacy_compatibility_adapter" : "none",
            inputs: null,
            usingFallbackDefaults: ["recommendation drafts are skipped without a planning-ready canonical profile"],
            compatibilityAdapter: Boolean(legacyProfileFallback),
            hardcodedNeutralAssumptions: [],
          },
      calendarInterpretation: {
        source: normalizedProfile ? "live_profile_inference" : "stored_inferred_type",
        readTimeBehavior:
          "Dashboard uses user overrides first, then live profile inference, and falls back to stored inferred types only when the current profile cannot classify the event.",
        liveProfileInputs: normalizedProfile
          ? {
              exerciseRecoveryValue: normalizedProfile.exerciseRecoveryValue,
              socialRecoveryValue: normalizedProfile.socialRecoveryValue,
              quietRecoveryValue: normalizedProfile.quietRecoveryValue,
              preferredRecoveryModes: normalizedProfile.preferredRecoveryModes,
              overloadSensitivity: normalizedProfile.overloadSensitivity,
            }
          : null,
        usingFallbackDefaultsAtSyncWhenProfileMissing: [],
        compatibilityAdapter: profileSource === "legacy_compatibility_adapter",
        hardcodedNeutralAssumptions: [],
        eventTypeCounts: interpretedEvents.reduce<Record<string, number>>((acc, event) => {
          const key = event.type;
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
        eventSources: interpretedEvents.reduce<Record<string, number>>((acc, event) => {
          acc[event.source] = (acc[event.source] ?? 0) + 1;
          return acc;
        }, {}),
      },
    },
    impactAnalysis: normalizedProfile
      ? analyzeProfileImpact(events, tasks, normalizedProfile)
      : null,
  };
}

function normalizeEvent(event: Awaited<ReturnType<typeof prisma.calendarEvent.findMany>>[number]) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay,
    inferredType: event.inferredType,
    userOverrideType: event.userOverrideType,
  } satisfies CalendarEventSnapshot;
}

function normalizeTask(task: Awaited<ReturnType<typeof prisma.task.findMany>>[number]) {
  return {
    id: task.id,
    title: task.title,
    dueAt: task.dueAt,
    estimatedHours: Number(task.estimatedHours),
    taskType: task.taskType,
    projectLabel: task.projectLabel,
    notes: task.notes,
    ambiguityLevel: task.ambiguityLevel,
    emotionalFriction: task.emotionalFriction,
    requiresUninterruptedBlock: task.requiresUninterruptedBlock,
    status: task.status,
  } satisfies TaskSnapshot;
}

export async function getDashboardPayload(userId: string) {
  const [profile, events, tasks, recommendations] = await Promise.all([
    prisma.workProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    }),
    prisma.task.findMany({
      where: { userId },
      orderBy: { dueAt: "asc" },
    }),
    prisma.recommendation.findMany({
      where: { userId, date: { gte: startOfLocalDay(new Date()) } },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  if (!profile) {
    return {
      profile: null,
      events,
      dashboardEvents: [],
      tasks,
      recommendations,
      insights: null,
      debug: null,
    };
  }

  const normalizedProfile = normalizePlanningProfile(profile);
  const normalizedEvents = events.map(normalizeEvent);
  const dashboardEvents = normalizedProfile
    ? normalizedEvents.map((event) => {
        const interpretation = getDashboardEventInterpretation(event, normalizedProfile);

        return {
          ...event,
          effectiveType: interpretation.type,
          effectiveTypeSource: interpretation.source,
        };
      })
    : normalizedEvents.map((event) => ({
        ...event,
        effectiveType: event.userOverrideType ?? event.inferredType,
        effectiveTypeSource: event.userOverrideType ? "user_override" : "stored_inferred_type",
      }));
  const normalizedTasks = tasks.map(normalizeTask);
  const insights = normalizedProfile
    ? generateRecommendationDrafts(normalizedEvents, normalizedTasks, normalizedProfile)
    : null;
  const legacyProfileFallback = normalizedProfile
    ? null
    : getLegacyCognitiveProfileFallback(profile);
  const debug = buildDashboardDebug(
    profile,
    normalizedProfile,
    legacyProfileFallback,
    normalizedEvents,
    normalizedTasks,
  );

  return {
    profile,
    normalizedProfile: normalizedProfile satisfies CognitiveProfileSnapshot | null,
    legacyProfileFallback,
    events,
    dashboardEvents,
    tasks,
    recommendations,
    insights,
    debug,
    recommendationsStale: Boolean(
      profile.updatedAt &&
        recommendations.some(
          (recommendation) => recommendation.updatedAt < profile.updatedAt,
        ),
    ),
  };
}

export async function persistRecommendations(userId: string, drafts: RecommendationDraft[]) {
  await prisma.recommendation.deleteMany({
    where: {
      userId,
      date: {
        gte: startOfLocalDay(new Date()),
      },
    },
  });

  if (!drafts.length) {
    return [];
  }

  const created = await prisma.$transaction(
    drafts.map((draft) =>
      prisma.recommendation.create({
        data: {
          userId,
          taskId: draft.taskId,
          date: startOfLocalDay(new Date()),
          recommendationType: draft.recommendationType as RecommendationType,
          summary: draft.summary,
          explanation: draft.explanation,
          score: draft.score,
          suggestedStart: draft.suggestedStart,
          suggestedEnd: draft.suggestedEnd,
        },
      }),
    ),
  );

  return created;
}

export async function countTasksByType(userId: string) {
  const grouped = await prisma.task.groupBy({
    by: ["taskType"],
    where: { userId, status: "active" },
    _count: true,
  });

  return grouped.reduce<Record<TaskType, number>>(
    (acc, item) => {
      acc[item.taskType] = item._count;
      return acc;
    },
    {
      deep_work: 0,
      problem_solving: 0,
      reading: 0,
      writing: 0,
      admin: 0,
      social_interpersonal: 0,
      errands_logistics: 0,
    },
  );
}
