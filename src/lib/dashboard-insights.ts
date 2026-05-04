import type { RecoveryIslandDay, RecoveryIslandSegment } from "@/components/recovery-islands-visual";
import { SITE_COPY } from "@/lib/copy";
import type { ClassifiedWeekEvent, CognitiveProfileSnapshot, WeekAnalysisMetrics } from "@/lib/domain";

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatDayList(labels: string[]) {
  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function getRecoveryModeLabel(tone: RecoveryIslandSegment["tone"]) {
  switch (tone) {
    case "exercise":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_MODE_LABEL_01;
    case "social":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_MODE_LABEL_02;
    case "care":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_MODE_LABEL_03;
    case "rest":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_MODE_LABEL_04;
    case "open":
    default:
      return "Unplanned time";
  }
}

function getApproximateTimeLabel(startMinute: number, endMinute: number) {
  const midpoint = (startMinute + endMinute) / 2;
  return midpoint < 300
    ? SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIME_BUCKET_MORNING_01
    : midpoint < 660
      ? SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIME_BUCKET_AFTERNOON_01
      : SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TIME_BUCKET_EVENING_01;
}

const RECOVERY_OPEN_WINDOW_START = 60;
const RECOVERY_OPEN_WINDOW_END = 900;
const MIN_OPEN_RECOVERY_MINUTES = 60;
const MAX_OPEN_RECOVERY_MINUTES = 60;
const MAX_VISIBLE_OPEN_SEGMENTS_PER_WEEK = 3;

function segmentsCollide(
  left: Pick<RecoveryIslandSegment, "startMinute" | "endMinute">,
  right: Pick<RecoveryIslandSegment, "startMinute" | "endMinute">,
  paddingMinutes = 24,
) {
  return (
    left.startMinute < right.endMinute + paddingMinutes &&
    right.startMinute < left.endMinute + paddingMinutes
  );
}

function getBoundedOpenRecoverySegment(segment: RecoveryIslandSegment | { startMinute: number; endMinute: number; emphasis?: "focus" | "fragmented" }) {
  const boundedStart = Math.max(RECOVERY_OPEN_WINDOW_START, segment.startMinute);
  const boundedEnd = Math.min(RECOVERY_OPEN_WINDOW_END, segment.endMinute);
  const boundedDuration = Math.max(0, boundedEnd - boundedStart);

  if (boundedDuration < MIN_OPEN_RECOVERY_MINUTES || segment.emphasis !== "fragmented") {
    return null;
  }

  const effectiveEnd = boundedStart + Math.min(MAX_OPEN_RECOVERY_MINUTES, boundedDuration);

  return {
    startMinute: boundedStart,
    endMinute: effectiveEnd,
    durationMinutes: effectiveEnd - boundedStart,
    emphasis: segment.emphasis,
  };
}

function getRecoveryDisplayLabel(
  tone: RecoveryIslandSegment["tone"],
) {
  switch (tone) {
    case "exercise":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PILL_LABEL_EXERCISE_01;
    case "social":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PILL_LABEL_SOCIAL_01;
    case "care":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PILL_LABEL_CARE_01;
    case "rest":
      return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PILL_LABEL_REST_01;
    case "open":
    default:
      return "Unplanned time";
  }
}

function getProfileBestWith(profile: CognitiveProfileSnapshot) {
  const preferredMode = profile.preferredRecoveryModes[0] ?? "quiet";

  if (preferredMode === "exercise" || profile.exerciseRecoveryValue >= 5) {
    return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_BEST_01;
  }

  if (preferredMode === "social" || profile.socialRecoveryValue >= 5) {
    return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_BEST_02;
  }

  return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_BEST_03;
}

function getDominantTone(
  toneMinutes: Record<RecoveryIslandSegment["tone"], number>,
  exclude: RecoveryIslandSegment["tone"][] = [],
) {
  return (Object.entries(toneMinutes) as Array<[RecoveryIslandSegment["tone"], number]>)
    .filter(([tone, minutes]) => minutes > 0 && !exclude.includes(tone))
    .sort((left, right) => right[1] - left[1])[0]?.[0];
}

function getProfilePriorityLine(
  profile: CognitiveProfileSnapshot,
  toneMinutes: Record<RecoveryIslandSegment["tone"], number>,
) {
  const preferredMode = profile.preferredRecoveryModes[0] ?? "quiet";

  if ((preferredMode === "exercise" || profile.exerciseRecoveryValue >= 5) && toneMinutes.exercise === 0) {
    return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_02;
  }

  if ((preferredMode === "social" || profile.socialRecoveryValue >= 5) && toneMinutes.social === 0) {
    return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_03;
  }

  if (toneMinutes.rest + toneMinutes.care === 0) {
    return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_04;
  }

  return SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_05;
}

function getIdealRecoveryLine(profile: CognitiveProfileSnapshot) {
  const preferredMode = profile.preferredRecoveryModes[0] ?? "quiet";

  if (preferredMode === "exercise" || profile.exerciseRecoveryValue >= 5) {
    return "Your profile usually recovers best when movement is placed before or after tighter stretches.";
  }

  if (preferredMode === "social" || profile.socialRecoveryValue >= 5) {
    return "Your profile tends to regain margin best from buffered social support that feels restorative rather than stacked.";
  }

  return "Your profile tends to recover best from longer quiet blocks and slower transitions between demands.";
}

export function buildPlanningStyleRead(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const pressureLine =
    profile.fragmentationCost >= 4 && safeNumber(metrics.squeezedOpenBlockCount) >= 3
      ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_HEADLINE_01
      : profile.transitionCost >= 4 && safeNumber(metrics.transitionDensity) >= 1
        ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_HEADLINE_02
        : profile.overloadSensitivity >= 4 && safeNumber(metrics.loadConcentration) >= 0.35
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_HEADLINE_03
          : SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_HEADLINE_03;

  const supportLine =
    profile.quietRecoveryValue >= 4 && safeNumber(metrics.recoverySoloMinutes) <= 180
      ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_DETAIL_01
      : profile.exerciseRecoveryValue >= 4 && safeNumber(metrics.exerciseCount) > 0
        ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_DETAIL_02
        : profile.socialRecoveryValue >= 4 && safeNumber(metrics.socialMinutes) > 0
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_DETAIL_03
          : SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_DETAIL_01;

  return {
    title: SITE_COPY.dashboard.COPY_DASHBOARD_PROFILE_PANEL_TITLE_01,
    headline: pressureLine,
    detail: supportLine,
  };
}

export function buildRecoveryIslandsInsight(
  classifiedEventsOrMetrics: ClassifiedWeekEvent[] | WeekAnalysisMetrics,
  metricsOrProfile: WeekAnalysisMetrics | CognitiveProfileSnapshot,
  maybeProfile?: CognitiveProfileSnapshot,
) {
  const classifiedEvents = Array.isArray(classifiedEventsOrMetrics) ? classifiedEventsOrMetrics : [];
  const metrics = Array.isArray(classifiedEventsOrMetrics)
    ? (metricsOrProfile as WeekAnalysisMetrics)
    : classifiedEventsOrMetrics;
  const profile = (Array.isArray(classifiedEventsOrMetrics)
    ? maybeProfile
    : metricsOrProfile) as CognitiveProfileSnapshot;

  const days: RecoveryIslandDay[] = metrics.weekShapeDays.map((day) => {
    const scheduledSegments: RecoveryIslandSegment[] = classifiedEvents.length > 0
      ? classifiedEvents
      .filter((event) =>
        (event.includeInRecoveryIslands ?? true) &&
        event.recoveryCategory !== null &&
        (event.clippedEndTime ?? event.endTime) > day.date &&
        (event.clippedStartTime ?? event.startTime) < new Date(day.date.getTime() + 24 * 60 * 60 * 1000),
      )
      .map((event) => {
        const wake = 7 * 60;
        const dayStart = new Date(day.date);
        const eventStart = event.clippedStartTime ?? event.startTime;
        const eventEnd = event.clippedEndTime ?? event.endTime;
        const startMinute = Math.max(
          0,
          Math.round((eventStart.getTime() - dayStart.getTime()) / (1000 * 60)) - wake,
        );
        const endMinute = Math.max(
          startMinute,
          Math.round((eventEnd.getTime() - dayStart.getTime()) / (1000 * 60)) - wake,
        );

        return {
          startMinute,
          endMinute,
          tone: event.recoveryCategory === "care"
            ? "care"
            : event.recoveryCategory === "social"
              ? "social"
              : event.recoveryCategory === "rest"
                ? "rest"
                : "exercise",
          emphasis: "steady" as const,
          displayLabel: getRecoveryDisplayLabel(
            event.recoveryCategory === "care"
              ? "care"
              : event.recoveryCategory === "social"
                ? "social"
                : event.recoveryCategory === "rest"
                  ? "rest"
                  : "exercise",
          ),
          timeLabel: getApproximateTimeLabel(startMinute, endMinute),
        } satisfies RecoveryIslandSegment;
      })
      : day.segments.flatMap((segment) => {
        const durationMinutes = Math.max(0, segment.endMinute - segment.startMinute);

        if (segment.kind !== "event" || durationMinutes <= 0 || !segment.eventType) {
          return [];
        }

        const recoveryCategory =
          segment.eventType === "exercise"
            ? "exercise"
            : segment.eventType === "social"
              ? "social"
              : segment.eventType === "meal" || segment.eventType === "personal_care" || segment.eventType === "errand"
                ? "care"
                : segment.eventType === "rest"
                  ? "rest"
                  : null;

        if (!recoveryCategory) {
          return [];
        }

        const tone = recoveryCategory === "care"
          ? "care"
          : recoveryCategory === "social"
            ? "social"
            : recoveryCategory === "rest"
              ? "rest"
              : "exercise";

        return [{
          startMinute: segment.startMinute,
          endMinute: segment.endMinute,
          tone,
          emphasis: "steady" as const,
          displayLabel: getRecoveryDisplayLabel(tone),
          timeLabel: getApproximateTimeLabel(segment.startMinute, segment.endMinute),
        }];
      });

    const openRecoveryCandidate = day.segments
      .filter((segment) => segment.kind === "open")
      .map((segment) => getBoundedOpenRecoverySegment(segment))
      .filter((segment): segment is NonNullable<typeof segment> => segment !== null)
      .filter((segment) =>
        scheduledSegments.every((scheduledSegment) => !segmentsCollide(segment, scheduledSegment)),
      )
      .sort((left, right) => Math.abs(75 - left.durationMinutes) - Math.abs(75 - right.durationMinutes))[0];

    const segments = [...scheduledSegments];

    if (openRecoveryCandidate) {
      segments.push({
        startMinute: openRecoveryCandidate.startMinute,
        endMinute: openRecoveryCandidate.endMinute,
        tone: "open",
        emphasis: "tentative",
        displayLabel: getRecoveryDisplayLabel("open"),
        timeLabel: getApproximateTimeLabel(openRecoveryCandidate.startMinute, openRecoveryCandidate.endMinute),
      });
    }

    const totalRecoveryMinutes = scheduledSegments
      .reduce(
      (sum, segment) => sum + (segment.endMinute - segment.startMinute),
      0,
    );

    return {
      label: day.label,
      date: day.date,
      totalRecoveryMinutes,
      segments,
    };
  });

  const openCandidates = days.flatMap((day) =>
    day.segments
      .filter((segment) => segment.tone === "open")
      .map((segment) => ({
        day,
        segment,
        score: Math.abs(75 - (segment.endMinute - segment.startMinute)),
      })),
  );
  const keptOpenKeys = new Set(
    openCandidates
      .sort((left, right) => left.score - right.score)
      .slice(0, MAX_VISIBLE_OPEN_SEGMENTS_PER_WEEK)
      .map(({ day, segment }) => `${day.date.toISOString()}-${segment.startMinute}-${segment.endMinute}`),
  );
  const normalizedDays = days.map((day) => ({
    ...day,
    segments: day.segments.filter((segment) =>
      segment.tone !== "open" ||
      keptOpenKeys.has(`${day.date.toISOString()}-${segment.startMinute}-${segment.endMinute}`),
    ),
  }));

  const toneMinutes = normalizedDays.flatMap((day) => day.segments).reduce<Record<RecoveryIslandSegment["tone"], number>>(
    (totals, segment) => {
      totals[segment.tone] += segment.endMinute - segment.startMinute;
      return totals;
    },
    {
      exercise: 0,
      social: 0,
      care: 0,
      rest: 0,
      open: 0,
    },
  );
  const totalRecoveryMinutes =
    toneMinutes.exercise +
    toneMinutes.social +
    toneMinutes.care +
    toneMinutes.rest;
  const usableBufferMinutes = toneMinutes.open;
  const activeDays = normalizedDays.filter((day) => day.totalRecoveryMinutes > 0);
  const detectableRecoveryBlockCount = normalizedDays.reduce(
    (sum, day) => sum + day.segments.filter((segment) => segment.tone !== "open").length,
    0,
  );
  const topDays = [...activeDays]
    .sort((left, right) => right.totalRecoveryMinutes - left.totalRecoveryMinutes)
    .slice(0, 2)
    .map((day) => day.label);
  const mostRestorativeDay =
    [...activeDays].sort((left, right) => right.totalRecoveryMinutes - left.totalRecoveryMinutes)[0] ?? null;
  const dominantRecoveryModes = (
    Object.entries(toneMinutes) as Array<[RecoveryIslandSegment["tone"], number]>
  )
    .filter(([tone, minutes]) => minutes > 0 && tone !== "open")
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tone]) => getRecoveryModeLabel(tone));

  let summary: string = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUMMARY_01;
  let supportingLine: string = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUPPORTING_01;
  const idealRecoveryLine = getIdealRecoveryLine(profile);
  let profileAlreadyVisible: string =
    SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_01;
  let profilePriority: string =
    SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_01;

  if (totalRecoveryMinutes > 0) {
    summary =
      activeDays.length >= 4
        ? SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUMMARY_02(formatDayList(topDays))
        : SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUMMARY_03(formatDayList(topDays));

    const dominantTone = getDominantTone(toneMinutes, ["open"]);
    supportingLine = dominantTone
      ? SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUPPORTING_02(getRecoveryModeLabel(dominantTone))
      : SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_SUPPORTING_01;

    const dominantVisibleTone = getDominantTone(toneMinutes, ["open"]);
    if (dominantVisibleTone === "exercise") {
      profileAlreadyVisible = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_02;
    } else if (dominantVisibleTone === "care") {
      profileAlreadyVisible = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_03;
    } else if (dominantVisibleTone === "rest") {
      profileAlreadyVisible = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_04;
    } else if (dominantVisibleTone === "social") {
      profileAlreadyVisible = SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_05;
    }

    profilePriority = getProfilePriorityLine(profile, toneMinutes);
  }

  return {
    days: normalizedDays,
    summary,
    supportingLine,
    idealRecoveryLine,
    profileBestWith: getProfileBestWith(profile),
    profileAlreadyVisible,
    profilePriority,
    detectableRecoveryBlockCount,
    visibleRecoveryDayCount: activeDays.length,
    totalRecoveryMinutes,
    usableBufferMinutes,
    mostRestorativeDay: mostRestorativeDay
      ? {
          label: mostRestorativeDay.label,
          totalRecoveryMinutes: mostRestorativeDay.totalRecoveryMinutes,
        }
      : null,
    dominantRecoveryModes,
  };
}

export function getMarginSnapshot(metrics: WeekAnalysisMetrics) {
  const scheduledLabel = safeNumber(metrics.scheduledLoadScore);
  const expectedLabel = safeNumber(metrics.overallLoadScore);
  const marginHours = Math.round((safeNumber(metrics.availableMarginMinutes) / 60) * 10) / 10;

  return {
    scheduledScore: scheduledLabel,
    expectedScore: expectedLabel,
    marginHours,
    comparison:
      expectedLabel - scheduledLabel >= 8 && safeNumber(metrics.latentDemandMinutes) >= 90
        ? "Scheduled load is lighter than likely lived load, but some real margin still remains in the week."
        : marginHours >= 6
          ? "The week still keeps some real margin, even where self-directed pressure is likely to fill part of the open time."
          : "Margin looks fairly limited, so the week will depend more on what stays protected than on how much time is technically open.",
  };
}
