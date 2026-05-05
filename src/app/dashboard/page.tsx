import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/app-shell";
import { DashboardDailyPanels } from "@/components/dashboard-daily-panels";
import { AnalyzeWeekSubmitButton } from "@/components/analyze-week-submit-button";
import { RecoveryIslandsVisual, RecoveryLegendCard } from "@/components/recovery-islands-visual";
import { StatusPill } from "@/components/status-pill";
import { analyzeWeekAction } from "@/app/actions/week-analysis";
import { DEFAULT_WAKE_HOUR } from "@/lib/constants";
import { SITE_COPY } from "@/lib/copy";
import type { CognitiveProfileSnapshot, WeekAnalysisMetrics, WeekShapeDay, WeekShapeSegment } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { getWeekAnalysisDashboardState } from "@/lib/week-analysis";
import { formatDateTime } from "@/lib/utils";
import { isGoogleOAuthConfigured } from "@/lib/auth";
import { getSubtypePresentation } from "@/lib/profile-presentation";
import {
  buildPlanningStyleRead,
  buildRecoveryIslandsInsight,
  getMarginSnapshot,
} from "@/lib/dashboard-insights";
import { resolveCompositionCategory, type WeekCompositionCategory } from "@/lib/week-event-classification";
import { aggregateCategorizedDurations } from "@/lib/week-duration-aggregation";
import {
  getGoogleCalendarUiStatus,
  getIncludedCalendarsSummary,
} from "@/lib/google-calendar-ui";

type DashboardState = Awaited<ReturnType<typeof getWeekAnalysisDashboardState>>;
type DashboardReport = NonNullable<DashboardState["report"]>;

const COMPOSITION_BAR_MAX_MINUTES = {
  work_class: 50 * 60,
  meetings_structured: 15 * 60,
  social: 20 * 60,
  recovery_solo: 30 * 60,
} as const;

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMinutesAsHours(minutes: number) {
  const safeMinutes = safeNumber(minutes);

  if (safeMinutes <= 0) {
    return "0h";
  }

  const hours = safeMinutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function toPercent(minutes: number, total: number) {
  const safeMinutes = safeNumber(minutes);
  const safeTotal = safeNumber(total);

  if (safeTotal <= 0) {
    return 0;
  }

  return Math.round((safeMinutes / safeTotal) * 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getLoadLabel(score: number) {
  if (score >= 83) return SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_STRAINED_01;
  if (score >= 65) return SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_TIGHT_01;
  if (score >= 45) return SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_FULL_01;
  if (score >= 25) return SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_STEADY_01;
  return SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_OPEN_01;
}

function buildCognitiveLoadSummary(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const score = Math.round(clamp(safeNumber(metrics.overallLoadScore), 0, 100));
  const scheduledScore = Math.round(clamp(safeNumber(metrics.scheduledLoadScore), 0, 100));
  const loadGap = score - scheduledScore;
  const marginSnapshot = getMarginSnapshot(metrics);
  const socialRead =
    safeNumber(metrics.socialMinutes) > 0
      ? profile.socialRecoveryValue >= 4
        ? "Social time looks more like support than added strain here, especially when it is buffered around the denser parts of the week."
        : "Social time is present, but for your profile it may still take up capacity if it sits too close to already tight stretches."
      : "This read is being shaped more by structure, transitions, and recovery than by social time.";
  const scheduledVsExpectedLine =
    loadGap >= 8 && safeNumber(metrics.latentDemandMinutes) >= 90
      ? `Calendar load reads ${getLoadLabel(scheduledScore)}, but likely lived load reads ${getLoadLabel(score)} because some self-directed work still seems unplaced. ${marginSnapshot.comparison}`
      : `Scheduled load and likely lived load are reading fairly similarly this week. ${marginSnapshot.comparison}`;

  if (score >= 83) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_STRAINED_01,
      tone: "alert" as const,
      interpretation: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_INTERPRETATION_STRAINED_01,
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 65) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_TIGHT_01,
      tone: "warm" as const,
      interpretation: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_INTERPRETATION_TIGHT_01,
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 45) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_FULL_01,
      tone: "warm" as const,
      interpretation: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_INTERPRETATION_FULL_01,
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 25) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_STEADY_01,
      tone: "success" as const,
      interpretation: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_INTERPRETATION_STEADY_01,
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  return {
    score,
    scheduledScore,
    marginHours: marginSnapshot.marginHours,
    label: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_LABEL_OPEN_01,
    tone: "success" as const,
    interpretation: SITE_COPY.dashboard.COPY_DASHBOARD_LOAD_INTERPRETATION_OPEN_01,
    comparisonLine: scheduledVsExpectedLine,
    supportingLine: socialRead,
  };
}

function buildComposition(report: DashboardReport) {
  const metrics = report.derivedMetrics;
  const totalWeekMinutes = 7 * 24 * 60;
  const sortedDays = [...metrics.weekShapeDays].sort((left, right) => left.date.getTime() - right.date.getTime());
  const rangeStart = sortedDays[0]?.date;
  const rangeEnd = sortedDays.length > 0
    ? new Date(sortedDays[sortedDays.length - 1]!.date.getTime() + 24 * 60 * 60 * 1000)
    : undefined;
  const openMinutes = metrics.weekShapeDays.reduce(
    (sum, day) =>
      sum +
      day.segments.reduce(
        (daySum, segment) =>
          segment.kind === "open" ? daySum + Math.max(0, segment.endMinute - segment.startMinute) : daySum,
        0,
      ),
    0,
  );
  const compositionCategories: WeekCompositionCategory[] = [
    "work_class",
    "meetings_structured",
    "social",
    "recovery_solo",
  ];
  const aggregation =
    rangeStart && rangeEnd
      ? aggregateCategorizedDurations(
          report.classifiedEvents
            .filter((event) => (event.includeInComposition ?? true) && (event.compositionCategory ?? resolveCompositionCategory(event.eventType)))
            .map((event) => ({
              title: event.title,
              startTime: event.clippedStartTime ?? event.startTime,
              endTime: event.clippedEndTime ?? event.endTime,
              sourceCalendarId: event.sourceCalendar,
              resolvedCategory: event.compositionCategory ?? resolveCompositionCategory(event.eventType),
            })),
          {
            categories: compositionCategories,
            priority: compositionCategories,
            rangeStart,
            rangeEnd,
          },
        )
      : null;

  return {
    bars: [
      {
        label: SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_BAR_LABEL_01,
        minutes: aggregation?.totals.work_class ?? 0,
        percent: toPercent(
          aggregation?.totals.work_class ?? 0,
          COMPOSITION_BAR_MAX_MINUTES.work_class,
        ),
      },
      {
        label: SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_BAR_LABEL_02,
        minutes: aggregation?.totals.meetings_structured ?? 0,
        percent: toPercent(
          aggregation?.totals.meetings_structured ?? 0,
          COMPOSITION_BAR_MAX_MINUTES.meetings_structured,
        ),
      },
      {
        label: SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_BAR_LABEL_03,
        minutes: aggregation?.totals.social ?? 0,
        percent: toPercent(
          aggregation?.totals.social ?? 0,
          COMPOSITION_BAR_MAX_MINUTES.social,
        ),
      },
      {
        label: SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_BAR_LABEL_04,
        minutes: aggregation?.totals.recovery_solo ?? 0,
        percent: toPercent(
          aggregation?.totals.recovery_solo ?? 0,
          COMPOSITION_BAR_MAX_MINUTES.recovery_solo,
        ),
      },
    ],
    openMinutes,
  };
}

function buildTrajectorySummary(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const committedByDay = metrics.committedHoursByDay;
  const earlyWeek = committedByDay
    .filter((day) => ["Monday", "Tuesday"].includes(day.label))
    .reduce((sum, day) => sum + safeNumber(day.committedHours), 0);
  const midweek = committedByDay
    .filter((day) => ["Wednesday", "Thursday"].includes(day.label))
    .reduce((sum, day) => sum + safeNumber(day.committedHours), 0);
  const lateWeek = committedByDay
    .filter((day) => ["Friday", "Saturday", "Sunday"].includes(day.label))
    .reduce((sum, day) => sum + safeNumber(day.committedHours), 0);

  const headline =
    midweek > earlyWeek * 1.2 && midweek > lateWeek * 1.15
      ? "Capacity is likely to narrow through the middle of the week, then loosen slightly afterward."
      : lateWeek > earlyWeek * 1.15
        ? "Capacity is more likely to narrow later in the week than at the beginning."
        : earlyWeek > lateWeek * 1.15
          ? "The week asks more of you early, then becomes easier to carry if the later openings stay protected."
          : "Capacity looks more even across the week, so the main difference will come from how much margin each day actually keeps.";

  const recoveryRead =
    safeNumber(metrics.recoverySoloMinutes) <= 120
      ? "Recovery appears thin relative to the visible load, so margin may narrow faster than the schedule alone suggests."
      : safeNumber(metrics.recoverySoloMinutes) <= 240
        ? "Recovery is present, but not abundant, so where it lands will matter more than the total amount on paper."
        : "Recovery is visibly present in the week, which gives the schedule more places to reset before strain compounds.";

  const socialRead =
    safeNumber(metrics.socialMinutes) > 0
      ? profile.socialRecoveryValue >= 4
        ? "Social time may function more like support or reset here, especially when it is buffered rather than stacked on top of dense days."
        : "Social time looks more capacity-taking for your profile, so it contributes to how full the week feels rather than acting like neutral background time."
      : "There is not much social time shaping the week, so the main story comes from structure, transitions, and recovery.";

  return {
    headline,
    details: [recoveryRead, socialRead],
  };
}

function buildPatternFeedback(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const feedback: Array<{ title: string; text: string }> = [];
  const committedByDay = metrics.committedHoursByDay;
  const midweekHours = committedByDay
    .filter((day) => ["Wednesday", "Thursday"].includes(day.label))
    .reduce((sum, day) => sum + safeNumber(day.committedHours), 0);
  const lateWeekHours = committedByDay
    .filter((day) => ["Friday", "Saturday", "Sunday"].includes(day.label))
    .reduce((sum, day) => sum + safeNumber(day.committedHours), 0);
  const totalCommittedHours = committedByDay.reduce((sum, day) => sum + safeNumber(day.committedHours), 0);
  const totalCommittedMinutes = safeNumber(metrics.totalCommittedMinutes);
  const socialShare = totalCommittedMinutes === 0 ? 0 : safeNumber(metrics.socialMinutes) / totalCommittedMinutes;

  if (safeNumber(metrics.loadConcentration) >= 0.35 || midweekHours >= totalCommittedHours * 0.42) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_COMPRESSION_01,
      text: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_COMPRESSION_01,
    });
  }

  if (safeNumber(metrics.squeezedOpenBlockCount) >= 3 || safeNumber(metrics.fragmentationBurden) >= 4.5) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_FALSE_OPENNESS_01,
      text:
        profile.fragmentationCost >= 4
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_01
          : SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_02,
    });
  }

  if (safeNumber(metrics.recoverySoloMinutes) <= 180) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_RECOVERY_MISMATCH_01,
      text:
        profile.quietRecoveryValue >= 4
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_01
          : profile.exerciseRecoveryValue >= 4 && metrics.exerciseCount === 0
            ? SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_02
            : SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_03,
    });
  }

  if (safeNumber(metrics.transitionDensity) >= 1.25) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_TRANSITION_01,
      text:
        profile.transitionCost >= 4
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_01
          : SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_02,
    });
  }

  if ((midweekHours + lateWeekHours) >= totalCommittedHours * 0.65 && safeNumber(metrics.recoverySoloMinutes) <= 180) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_FATIGUE_01,
      text: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_FATIGUE_01,
    });
  }

  if (socialShare >= 0.18) {
    feedback.push({
      title: SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TITLE_SOCIAL_DENSE_01,
      text:
        profile.socialRecoveryValue >= 4
          ? SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_01
          : SITE_COPY.dashboard.COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_02,
    });
  }

  return feedback.slice(0, 5);
}

function buildRecoveryIslands(
  report: DashboardReport,
  profile: CognitiveProfileSnapshot,
) {
  return buildRecoveryIslandsInsight(report.classifiedEvents, report.derivedMetrics, profile);
}

function formatMinuteClock(minute: number) {
  const totalMinutes = DEFAULT_WAKE_HOUR * 60 + minute;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutePart = totalMinutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${minutePart.toString().padStart(2, "0")} ${suffix}`;
}

function formatWindowLabel(day: WeekShapeDay, segment: WeekShapeSegment) {
  return `${day.label} ${formatMinuteClock(segment.startMinute)}-${formatMinuteClock(segment.endMinute)}`;
}

function getOpenSegments(days: WeekShapeDay[], emphasis?: "focus" | "fragmented") {
  return days.flatMap((day) =>
    day.segments
      .filter(
        (segment) =>
          segment.kind === "open" &&
          (emphasis ? segment.emphasis === emphasis : true) &&
          segment.endMinute > segment.startMinute,
      )
      .map((segment) => ({
        day,
        segment,
        durationMinutes: segment.endMinute - segment.startMinute,
      })),
  );
}

function buildWindowRead(report: DashboardReport) {
  const metrics = report.derivedMetrics;
  const focusWindows = getOpenSegments(metrics.weekShapeDays, "focus");
  const fragmentedWindows = getOpenSegments(metrics.weekShapeDays, "fragmented");
  const bestFocusWindow = [...focusWindows].sort(
    (left, right) => right.durationMinutes - left.durationMinutes,
  )[0];
  const mostMisleadingGap = [...fragmentedWindows].sort(
    (left, right) => right.durationMinutes - left.durationMinutes,
  )[0];
  const busiestDay = [...metrics.committedHoursByDay].sort(
    (left, right) => right.committedHours - left.committedHours,
  )[0];

  const primaryRecommendation = bestFocusWindow
    ? `Place demanding work in ${formatWindowLabel(bestFocusWindow.day, bestFocusWindow.segment)}. It is the week’s most reliable open stretch, not just the biggest empty patch.`
    : metrics.morningUsableMinutes >= metrics.afternoonUsableMinutes
      ? "Place demanding work earlier in the day, when the week keeps more usable runway before commitments stack up."
      : "Place demanding work later in the day only where open time stays buffered; the week has less reliable runway than it first appears.";

  const mainRisk = mostMisleadingGap
    ? `If unchanged, gaps like ${formatWindowLabel(mostMisleadingGap.day, mostMisleadingGap.segment)} may look open on paper but break down as reliable work time.`
    : busiestDay && busiestDay.committedHours >= 4
      ? `If unchanged, ${busiestDay.label} is likely to make the week feel tighter than the total hours suggest.`
      : metrics.transitionDensity >= 1.3
        ? "If unchanged, open time after classes, meetings, or appointments is likely to be less reliable than it looks."
        : "If unchanged, the week may invite you to overcount open time that is better suited to lighter work than to demanding starts.";

  const planningRule = bestFocusWindow
    ? metrics.squeezedOpenBlockCount >= metrics.bufferedOpenBlockCount
      ? "Protect the clean window first, then let broken gaps absorb admin, setup, and other lighter tasks."
      : "Use reliability, not total open time, as the rule: place important work in buffered windows before the week fills in around them."
    : metrics.transitionDensity >= 1.3
      ? "Treat open time between structured commitments as lighter-work space unless it has real buffer around it."
      : "Decide the week by the cleanest available window first, then fit the rest around it.";

  return {
    primaryRecommendation,
    mainRisk,
    planningRule,
    bestFocusWindow,
    mostMisleadingGap,
    busiestDay,
  };
}

function buildInterventions(
  report: DashboardReport,
  profile: CognitiveProfileSnapshot,
) {
  const metrics = report.derivedMetrics;
  const { bestFocusWindow, mostMisleadingGap, busiestDay } = buildWindowRead(report);
  const interventions = [
    {
      label: "Key intervention",
      text: bestFocusWindow
        ? `If unchanged, demanding work is likely to drift into less reliable time around the denser stretches. If adjusted, protect ${formatWindowLabel(bestFocusWindow.day, bestFocusWindow.segment)} early and let the week organize around that cleaner window.`
        : "If unchanged, the week is likely to scatter demanding work into smaller, less reliable gaps. If adjusted, choose one clearer block early and let the lighter tasks expand around it.",
    },
    {
      label: "What to protect",
      text:
        mostMisleadingGap
          ? `Protect the cleaner windows from spillover by keeping ${formatWindowLabel(mostMisleadingGap.day, mostMisleadingGap.segment)} for lighter work, admin, or recovery instead of letting it compete with your best block.`
          : bestFocusWindow
            ? `Protect ${formatWindowLabel(bestFocusWindow.day, bestFocusWindow.segment)} from meetings, errands, and setup work so it stays the most dependable capacity in the week.`
            : report.suggestions[0],
    },
    {
      label: "What to add",
      text:
        metrics.recoverySoloMinutes <= 120
          ? profile.quietRecoveryValue >= 4
            ? "Add one quieter reset block near the densest stretch so the week has a place to come down before strain starts accumulating."
            : "Add one explicit recovery hour near the densest stretch so the week has a visible reset point instead of running edge to edge."
          : metrics.totalOpenMinutes <= metrics.totalCommittedMinutes * 0.85
            ? "Add one small protected buffer before or after the busiest day so the week has at least one place to decompress."
            : "Add one explicit decision about which open block is for recovery so the freest time does not quietly turn into overflow.",
    },
  ];

  if (busiestDay && metrics.transitionDensity >= 1.1) {
    interventions.push({
      label: "What to place carefully",
      text: `Around ${busiestDay.label}, place flexible or lower-stakes work after structured commitments rather than assuming that open time will stay usable.`,
    });
  }

  return interventions.slice(0, 3);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const calendarStatusParam = typeof params?.calendar === "string" ? params.calendar : null;
  const state = await getWeekAnalysisDashboardState(user.id);
  const googleOAuthConfigured = isGoogleOAuthConfigured();

  if (!state.profile) {
    redirect("/onboarding");
  }

  const googleUiStatus = getGoogleCalendarUiStatus({
    googleOAuthConfigured,
    account: state.googleAccount,
    surfaceError: calendarStatusParam,
  });
  const canAnalyze = Boolean(
    googleUiStatus === "connected_ready" && state.normalizedProfile,
  );
  const hasReport = Boolean(state.report);
  const statusTone =
    googleUiStatus === "connected_ready"
      ? "success"
      : googleUiStatus === "provider_access_restricted"
        ? "warm"
        : "alert";
  const statusLabel =
    googleUiStatus === "connected_ready"
      ? SITE_COPY.shared.COPY_SHARED_STATUS_CONNECTED_01
      : googleUiStatus === "reconnect_needed"
        ? SITE_COPY.shared.COPY_SHARED_STATUS_RECONNECT_01
        : googleUiStatus === "missing_calendar_access"
          ? SITE_COPY.shared.COPY_SHARED_STATUS_MISSING_ACCESS_01
          : googleUiStatus === "provider_access_restricted"
            ? SITE_COPY.shared.COPY_SHARED_STATUS_PROVIDER_RESTRICTED_01
            : SITE_COPY.shared.COPY_SHARED_STATUS_NOT_CONNECTED_01;
  const primaryActionLabel = hasReport
    ? SITE_COPY.dashboard.COPY_DASHBOARD_ANALYZE_ACTION_02
    : SITE_COPY.dashboard.COPY_DASHBOARD_ANALYZE_ACTION_01;
  const calendarSourceSummary = getIncludedCalendarsSummary({
    selectedCalendarIds: state.selectedCalendarIds,
    calendars: state.availableCalendars,
  });
  const cognitiveLoadSummary = state.report
    && state.normalizedProfile
    ? buildCognitiveLoadSummary(state.report.derivedMetrics, state.normalizedProfile)
    : null;
  const composition = state.report ? buildComposition(state.report) : { bars: [], openMinutes: 0 };
  const balanceFeedback =
    state.report && state.normalizedProfile
      ? buildPatternFeedback(state.report.derivedMetrics, state.normalizedProfile)
      : [];
  const interventions =
    state.report && state.normalizedProfile
      ? buildInterventions(state.report, state.normalizedProfile)
      : [];
  const recoveryIslands =
    state.report && state.normalizedProfile
      ? buildRecoveryIslands(state.report, state.normalizedProfile)
      : null;
  const planningStyleRead =
    state.report && state.normalizedProfile
      ? buildPlanningStyleRead(state.report.derivedMetrics, state.normalizedProfile)
      : null;
  const subtypePresentation = state.normalizedProfile
    ? getSubtypePresentation(state.normalizedProfile.subtypeName)
    : null;
  const subtypeBullets = [
    planningStyleRead?.headline,
    recoveryIslands?.supportingLine,
  ].filter(Boolean) as string[];

  return (
    <AppShell heading="Dashboard" userName={user.name}>
      <main className="space-y-8">
        <section className="mb-8 rounded-[28px] border border-[#D4CDD9] bg-[#E5E3EA] px-6 py-5 text-[#2C2A3A] shadow-[0_1px_2px_rgba(31,41,51,0.04)] backdrop-blur md:px-7 md:py-5.5">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2.5">
              <h1 className="font-serif text-[2rem] leading-tight text-[#2C2A3A]">
                {SITE_COPY.dashboard.COPY_DASHBOARD_ANALYZE_TITLE_01}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                <StatusPill>{calendarSourceSummary.label}</StatusPill>
                {state.report ? (
                  <StatusPill>
                    {SITE_COPY.dashboard.COPY_DASHBOARD_STATUS_LAST_ANALYZED_01(
                      formatDateTime(state.report.analyzedAt),
                    )}
                  </StatusPill>
                ) : null}
              </div>
            </div>
            <div className="flex items-start lg:items-center">
              {canAnalyze ? (
                <form action={analyzeWeekAction}>
                  <AnalyzeWeekSubmitButton idleLabel={primaryActionLabel} />
                </form>
              ) : (
                <Link
                  href={state.normalizedProfile ? "/settings" : "/onboarding?edit=1"}
                  className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                >
                  {state.normalizedProfile
                    ? googleOAuthConfigured
                      ? SITE_COPY.dashboard.COPY_DASHBOARD_ACTION_CONNECT_SETTINGS_01
                      : SITE_COPY.dashboard.COPY_DASHBOARD_ACTION_FINISH_LOCAL_OAUTH_01
                    : SITE_COPY.dashboard.COPY_DASHBOARD_ACTION_REFRESH_PROFILE_01}
                </Link>
              )}
            </div>
          </div>
        </section>

        {!state.normalizedProfile ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_PROFILE_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_PROFILE_BODY_01}
            </p>
          </section>
        ) : !googleOAuthConfigured ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_OAUTH_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_OAUTH_BODY_01}
            </p>
          </section>
        ) : googleUiStatus === "not_connected" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_CONNECT_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_CONNECT_BODY_01}
            </p>
          </section>
        ) : googleUiStatus === "missing_calendar_access" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_MISSING_ACCESS_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_MISSING_ACCESS_BODY_01}
            </p>
          </section>
        ) : googleUiStatus === "provider_access_restricted" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_BODY_01}
            </p>
          </section>
        ) : googleUiStatus === "reconnect_needed" ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_RECONNECT_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_RECONNECT_BODY_01}
            </p>
          </section>
        ) : state.report ? (
          <section className="space-y-10">
            {cognitiveLoadSummary ? (
              <DashboardDailyPanels
                days={state.report.derivedMetrics.dailyLoadScores}
                weekLoadSummary={{
                  score: cognitiveLoadSummary.score,
                  label: cognitiveLoadSummary.label,
                  tone: cognitiveLoadSummary.tone,
                  interpretation: cognitiveLoadSummary.interpretation,
                }}
                profilePlanningInsight={
                  planningStyleRead?.headline ??
                  subtypePresentation?.overviewLine ??
                  cognitiveLoadSummary.supportingLine
                }
              />
            ) : null}

            {subtypePresentation || composition.bars.length > 0 ? (
              <section className="grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] xl:items-start xl:gap-9">
                {subtypePresentation ? (
                  <section className="rounded-[34px] border border-[#D4CDD9] bg-[#E5E3EA] px-9 py-9 shadow-[0_1px_2px_rgba(31,41,51,0.04)] backdrop-blur">
                    <div className="space-y-2.5">
                      <h2 className="max-w-3xl font-serif text-[2.05rem] leading-[1.08] text-slate-950 xl:text-[2.15rem]">
                        {subtypePresentation.name}
                      </h2>
                    </div>
                    <p className="mt-5 max-w-[42rem] text-[17px] leading-[1.65] text-slate-700">
                      {subtypePresentation.overviewLine}
                    </p>
                    {subtypeBullets.length > 0 ? (
                      <div className="mt-6 max-w-[42rem]">
                        <div className="h-px w-full max-w-[30rem] bg-[#8D96A8]/40" />
                        <ul className="mt-6 space-y-4.5 text-[17px] leading-[1.6] text-slate-700">
                          {subtypeBullets.slice(0, 2).map((bullet) => (
                            <li key={bullet} className="flex items-start gap-2">
                              <span className="mt-[0.7em] h-1.5 w-1.5 rounded-full bg-[#B68B98]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {composition.bars.length > 0 ? (
                  <section className="rounded-[32px] border border-[#E8E2DB] bg-white px-8 py-7 shadow-[var(--surface-shadow)] backdrop-blur">
                    <div className="pb-1.5">
                      <h2 className="font-serif text-[1.82rem] leading-[1.08] text-slate-950 xl:text-[1.92rem]">
                        {SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_TITLE_01}
                      </h2>
                    </div>
                    <div className="mt-6 space-y-5">
                      {composition.bars.map((item) => (
                        <article key={item.label} className="space-y-2.5">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                            <p className="text-[15px] font-semibold text-slate-900">{item.label}</p>
                            <p className="text-right text-[15px] tabular-nums text-slate-500">
                              {formatMinutesAsHours(item.minutes)}
                            </p>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(40,38,55,0.10)]">
                            <div
                              className="h-full rounded-full bg-[#2C2A3A]"
                              style={{
                                width: `${item.percent <= 0 ? 0 : Math.max(8, Math.min(100, item.percent))}%`,
                              }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-[#EEE7DF] pt-4">
                      <p className="text-sm leading-6 text-slate-600">
                      <span className="font-medium text-slate-800">
                        {SITE_COPY.dashboard.COPY_DASHBOARD_COMPOSITION_OPEN_CAPACITY_01(
                          formatMinutesAsHours(composition.openMinutes),
                        )}
                      </span>
                      </p>
                    </div>
                  </section>
                ) : null}
              </section>
            ) : null}

            {recoveryIslands && recoveryIslands.detectableRecoveryBlockCount >= 2 ? (
              <section className="mt-10 rounded-[30px] border border-[rgba(91,120,103,0.22)] bg-[linear-gradient(to_bottom,#EAF2ED_0%,#E4ECE6_100%)] px-6 py-5 shadow-[var(--surface-shadow)] backdrop-blur xl:mx-auto xl:max-w-[76rem] xl:px-7 xl:py-5.5">
                <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.43fr)_minmax(0,0.57fr)] xl:items-center">
                  <aside className="rounded-[22px] border border-[rgba(31,41,51,0.08)] bg-[rgba(255,255,255,0.86)] px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="space-y-2.5">
                      <p className="text-[12.5px] font-semibold tracking-[0.06em] text-[rgba(91,107,115,0.65)]">
                        {SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_PROFILE_TITLE_01}
                      </p>
                      <div className="space-y-2 text-[14px] leading-[1.5] text-[rgba(31,41,51,0.78)]">
                        <p>{recoveryIslands.profileBestWith}</p>
                        <div className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#7BAA8D]" />
                          <p>{recoveryIslands.profileAlreadyVisible}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B7A9D6]" />
                          <p>{recoveryIslands.profilePriority}</p>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <div className="space-y-1 xl:pl-2">
                    <h2 className="font-serif text-[2.08rem] leading-[1.02] text-slate-900 xl:text-[2.18rem]">
                      {SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_TITLE_01}
                    </h2>
                    <p className="max-w-3xl text-[16px] leading-[1.58] text-slate-700">
                      {recoveryIslands.summary}
                    </p>
                    <p className="max-w-3xl text-[16px] leading-[1.58] text-slate-600">
                      {recoveryIslands.supportingLine}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <RecoveryIslandsVisual days={recoveryIslands.days} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(360px,0.36fr)_minmax(0,0.64fr)] xl:items-stretch">
                  <div className="h-full rounded-[22px] border border-[rgba(31,41,51,0.08)] bg-[rgba(255,255,255,0.86)] px-6 py-5">
                    <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-6">
                      <div className="min-w-0 space-y-1.5">
                        <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          {SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_STAT_TITLE_01}
                        </p>
                        <p className="font-serif text-[2rem] leading-none text-slate-900">
                          {Math.round((recoveryIslands.totalRecoveryMinutes / 60) * 10) / 10}h
                        </p>
                        <p className="text-[13px] leading-5 text-slate-500">
                          {SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_STAT_SUBTITLE_01}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-1.5 border-l border-[#D9E2DB] pl-6">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                          {SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_STAT_TITLE_02}
                        </p>
                        <p className="font-serif text-[2rem] leading-none text-slate-900">
                          {recoveryIslands.mostRestorativeDay?.label ??
                            SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_STAT_EMPTY_01}
                        </p>
                        <p className="text-[13px] leading-5 text-slate-500">
                          {recoveryIslands.mostRestorativeDay
                            ? `${formatMinutesAsHours(recoveryIslands.mostRestorativeDay.totalRecoveryMinutes)} visible`
                            : SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_STAT_EMPTY_02}
                        </p>
                      </div>
                    </div>
                  </div>

                  <RecoveryLegendCard />
                </div>

                <div className="mt-2 text-center text-[11px] leading-5 text-slate-500">
                  <span>{SITE_COPY.dashboard.COPY_DASHBOARD_RECOVERY_FOOTNOTE_01}</span>
                </div>
              </section>
            ) : null}

            {cognitiveLoadSummary && cognitiveLoadSummary.score > 85 ? (
              <section className="rounded-[32px] border border-[#E8E2DB] bg-white px-7 py-6 text-slate-900 shadow-[var(--surface-shadow)]">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#866477]">
                    {SITE_COPY.dashboard.COPY_DASHBOARD_INTERVENTIONS_TITLE_01}
                  </p>
                </div>
                {balanceFeedback.length > 0 ? (
                  <div className="mt-3.5 space-y-2">
                    {balanceFeedback.slice(0, 2).map((item) => (
                      <p key={item.title} className="text-sm leading-7 text-slate-600">
                        <span className="font-semibold text-slate-900">{item.title}:</span> {item.text}
                      </p>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
        ) : (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_NO_REPORT_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.dashboard.COPY_DASHBOARD_EMPTY_NO_REPORT_BODY_01}
            </p>
          </section>
        )}

      </main>
    </AppShell>
  );
}
