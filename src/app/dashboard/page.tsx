import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/app-shell";
import { DailyLoadTrajectory } from "@/components/daily-load-trajectory";
import { RecoveryIslandsVisual } from "@/components/recovery-islands-visual";
import { StatusPill } from "@/components/status-pill";
import { analyzeWeekAction } from "@/app/actions/week-analysis";
import { DEFAULT_WAKE_HOUR } from "@/lib/constants";
import type { CognitiveProfileSnapshot, WeekAnalysisMetrics, WeekShapeDay, WeekShapeSegment } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { getWeekAnalysisDashboardState } from "@/lib/week-analysis";
import { formatDateTime } from "@/lib/utils";
import { isGoogleOAuthConfigured } from "@/lib/auth";
import {
  buildPlanningStyleRead,
  buildRecoveryIslandsInsight,
  getMarginSnapshot,
} from "@/lib/dashboard-insights";
import {
  getGoogleCalendarUiStatus,
  getIncludedCalendarsSummary,
  getGoogleCalendarWeekLink,
} from "@/lib/google-calendar-ui";

type DashboardState = Awaited<ReturnType<typeof getWeekAnalysisDashboardState>>;
type DashboardReport = NonNullable<DashboardState["report"]>;

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
  if (score >= 83) return "Strained";
  if (score >= 65) return "Tight";
  if (score >= 45) return "Full";
  if (score >= 25) return "Steady";
  return "Open";
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
      label: "Strained",
      tone: "alert" as const,
      interpretation:
        "Demand is likely to outpace support this week, so without adjustment the schedule may feel harder to live through than it looks.",
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 65) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: "Tight",
      tone: "warm" as const,
      interpretation:
        "The week has limited margin, so structure, recovery, and transitions will shape how usable it feels.",
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 45) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: "Full",
      tone: "warm" as const,
      interpretation:
        "The week is carrying real demand, but it remains supportable if recovery and placement stay intentional.",
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  if (score >= 25) {
    return {
      score,
      scheduledScore,
      marginHours: marginSnapshot.marginHours,
      label: "Steady",
      tone: "success" as const,
      interpretation:
        "The week has meaningful structure, but it still leaves enough margin to stay workable.",
      comparisonLine: scheduledVsExpectedLine,
      supportingLine: socialRead,
    };
  }

  return {
    score,
    scheduledScore,
    marginHours: marginSnapshot.marginHours,
    label: "Open",
    tone: "success" as const,
    interpretation:
      "This week has real breathing room, and your capacity is less likely to be constrained by structure alone.",
    comparisonLine: scheduledVsExpectedLine,
    supportingLine: socialRead,
  };
}

function buildComposition(metrics: WeekAnalysisMetrics) {
  const totalMinutes = safeNumber(metrics.totalCommittedMinutes) + safeNumber(metrics.totalOpenMinutes);

  return [
    {
      label: "Work / class",
      minutes: safeNumber(metrics.workClassMinutes),
      percent: toPercent(safeNumber(metrics.workClassMinutes), totalMinutes),
    },
    {
      label: "Meetings / structured",
      minutes: safeNumber(metrics.meetingsStructuredMinutes),
      percent: toPercent(safeNumber(metrics.meetingsStructuredMinutes), totalMinutes),
    },
    {
      label: "Social",
      minutes: safeNumber(metrics.socialMinutes),
      percent: toPercent(safeNumber(metrics.socialMinutes), totalMinutes),
    },
    {
      label: "Recovery / solo",
      minutes: safeNumber(metrics.recoverySoloMinutes),
      percent: toPercent(safeNumber(metrics.recoverySoloMinutes), totalMinutes),
    },
    {
      label: "Open time",
      minutes: safeNumber(metrics.totalOpenMinutes),
      percent: toPercent(safeNumber(metrics.totalOpenMinutes), totalMinutes),
    },
  ];
}

function buildCompositionInterpretation(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const totalVisibleMinutes = Math.max(
    1,
    safeNumber(metrics.totalCommittedMinutes) + safeNumber(metrics.totalOpenMinutes),
  );
  const openShare = safeNumber(metrics.totalOpenMinutes) / totalVisibleMinutes;
  const socialShare = safeNumber(metrics.socialMinutes) / totalVisibleMinutes;
  const recoveryShare = safeNumber(metrics.recoverySoloMinutes) / totalVisibleMinutes;
  const structuredShare =
    (safeNumber(metrics.workClassMinutes) + safeNumber(metrics.meetingsStructuredMinutes)) /
    totalVisibleMinutes;
  const socialRead =
    socialShare >= 0.12
      ? profile.socialRecoveryValue >= 4
        ? "Social plans are a meaningful part of the week and may function more like recovery than interruption."
        : "Social plans take a meaningful share of the week, so they may read as real load rather than neutral background time."
      : "Social time is present, but it does not dominate the week’s overall composition.";
  const recoveryRead =
    recoveryShare <= 0.08 && structuredShare >= 0.32
      ? "Explicit recovery and solo space are relatively thin compared with the structured load, so the week may feel tighter in practice than the hours alone suggest."
      : openShare >= 0.4
        ? "A large share of the visible week is still open, but whether that time feels restorative or truly usable depends on how protected it stays."
        : "The week is composed more by commitments than by open space, so small shifts in placement will matter more than adding volume.";

  return `${socialRead} ${recoveryRead}`;
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
      title: "Compression",
      text: "A disproportionate share of the week is landing in a narrow stretch, which can make your margin drop faster than the total hours alone suggest.",
    });
  }

  if (safeNumber(metrics.squeezedOpenBlockCount) >= 3 || safeNumber(metrics.fragmentationBurden) >= 4.5) {
    feedback.push({
      title: "False openness",
      text:
        profile.fragmentationCost >= 4
          ? "Several open-looking gaps are likely to be misleading because your profile is especially sensitive to interruption and broken runway."
          : "Several open-looking gaps are likely to behave more like overflow space than like true margin.",
    });
  }

  if (safeNumber(metrics.recoverySoloMinutes) <= 180) {
    feedback.push({
      title: "Recovery mismatch",
      text:
        profile.quietRecoveryValue >= 4
          ? "The week does not show much protected quieter reset time, so the recovery that does exist may not land where your profile benefits from it most."
          : profile.exerciseRecoveryValue >= 4 && metrics.exerciseCount === 0
            ? "The week is light on the kind of physical reset your profile tends to use well, so support may feel thinner than the calendar implies."
            : "Recovery is present only lightly or unevenly, which makes the week more likely to feel effortful as demands stack up.",
    });
  }

  if (safeNumber(metrics.transitionDensity) >= 1.25) {
    feedback.push({
      title: "Transition overload",
      text:
        profile.transitionCost >= 4
          ? "There are enough mode switches in the week that your profile is likely to pay a real capacity cost just from changing gears."
          : "The schedule asks for a lot of switching, which makes open time less stable even when the total hours still look reasonable.",
    });
  }

  if ((midweekHours + lateWeekHours) >= totalCommittedHours * 0.65 && safeNumber(metrics.recoverySoloMinutes) <= 180) {
    feedback.push({
      title: "Fatigue accumulation",
      text: "Because the denser stretch is not followed by much visible recovery, the week is more likely to wear on you progressively rather than all at once.",
    });
  }

  if (socialShare >= 0.18) {
    feedback.push({
      title: "Socially dense",
      text:
        profile.socialRecoveryValue >= 4
          ? "Social time is prominent enough to shape the week, but it is more likely to feel restorative when it is not pressed tightly against the heaviest commitments."
          : "Social time is prominent enough to shape the week, and for your profile it may function more like demand than like passive relief.",
    });
  }

  return feedback.slice(0, 5);
}

function buildRecoveryIslands(
  report: DashboardReport,
  profile: CognitiveProfileSnapshot,
) {
  return buildRecoveryIslandsInsight(report.derivedMetrics, profile);
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
  const showLoadDebug = process.env.PROFILE_MODEL_DEBUG === "true";

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
      ? "Connected and ready"
      : googleUiStatus === "reconnect_needed"
        ? "Reconnect needed"
        : googleUiStatus === "missing_calendar_access"
          ? "Calendar access missing"
          : googleUiStatus === "provider_access_restricted"
            ? "Provider access restricted"
            : "Not connected";
  const statusCopy =
    googleUiStatus === "connected_ready"
      ? hasReport
        ? "Selected calendars are merged into one week read."
        : "Your calendar is connected. Headroom is ready to run a fresh read of the next seven days."
      : googleUiStatus === "reconnect_needed"
        ? "Headroom could not refresh calendar access for this account."
        : googleUiStatus === "missing_calendar_access"
          ? "This Google account is linked, but it does not currently include read-only calendar access."
          : googleUiStatus === "provider_access_restricted"
            ? "Google allowed sign-in, but calendar data is currently restricted for this account."
            : googleOAuthConfigured
              ? "Google Calendar is not connected yet."
              : "Google Calendar analysis is unavailable until local OAuth is configured.";
  const nextStepCopy =
    googleUiStatus === "connected_ready"
      ? hasReport
      : googleUiStatus === "provider_access_restricted"
        ? "Review Google account access restrictions, then reconnect and try again."
        : googleUiStatus === "missing_calendar_access"
          ? "Reconnect Google Calendar and approve read-only calendar access."
          : googleUiStatus === "reconnect_needed"
            ? "Reconnect Google Calendar, then run a fresh analysis."
            : googleOAuthConfigured
              ? "Connect Google Calendar in Settings to get started."
              : "Finish local OAuth setup before connecting Google Calendar.";
  const primaryActionLabel = hasReport ? "Re-analyze Week" : "Analyze My Week";
  const openCalendarHref = getGoogleCalendarWeekLink();
  const calendarSourceSummary = getIncludedCalendarsSummary({
    selectedCalendarIds: state.selectedCalendarIds,
    calendars: state.availableCalendars,
  });
  const cognitiveLoadSummary = state.report
    && state.normalizedProfile
    ? buildCognitiveLoadSummary(state.report.derivedMetrics, state.normalizedProfile)
    : null;
  const composition = state.report ? buildComposition(state.report.derivedMetrics) : [];
  const compositionInterpretation =
    state.report && state.normalizedProfile
      ? buildCompositionInterpretation(state.report.derivedMetrics, state.normalizedProfile)
      : "";
  const trajectorySummary =
    state.report && state.normalizedProfile
      ? buildTrajectorySummary(state.report.derivedMetrics, state.normalizedProfile)
      : null;
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
  const debugRawScores = state.report
    ? state.report.derivedMetrics.dailyLoadDebug.map((day) => safeNumber(day.rawScoreBeforeScaling))
    : [];
  const debugDisplayScores = state.report
    ? state.report.derivedMetrics.dailyLoadScores.map((day) => safeNumber(day.score))
    : [];
  const rawRange =
    debugRawScores.length > 0
      ? Math.max(...debugRawScores) - Math.min(...debugRawScores)
      : 0;
  const displayRange =
    debugDisplayScores.length > 0
      ? Math.max(...debugDisplayScores) - Math.min(...debugDisplayScores)
      : 0;
  const displayScoreCounts = debugDisplayScores.reduce<Record<number, number>>((counts, score) => {
    counts[score] = (counts[score] ?? 0) + 1;
    return counts;
  }, {});
  const largestIdenticalDisplayShare =
    debugDisplayScores.length > 0
      ? Math.max(...Object.values(displayScoreCounts)) / debugDisplayScores.length
      : 0;
  const tooManyIdenticalDisplayScores = largestIdenticalDisplayShare > 0.5;
  const suspiciousRangeCompression = rawRange > 20 && displayRange < 5;
  const insufficientMidrangeSpread = rawRange > 10 && displayRange < 15;
  const lowRawOverstated = state.report
    ? state.report.derivedMetrics.dailyLoadDebug.some(
        (day) =>
          safeNumber(day.rawScoreBeforeScaling) < 10 && safeNumber(day.finalDisplayScore) > 70,
      )
    : false;

  return (
    <AppShell heading="Dashboard" userName={user.name}>
      <main className="space-y-8">
        <section className="rounded-[30px] border border-white/60 bg-white/86 px-6 py-6 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                  Dashboard
                </p>
                <h1 className="font-serif text-4xl leading-tight text-slate-950">
                  Analyze My Week
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                <StatusPill>{calendarSourceSummary.label}</StatusPill>
                <StatusPill>Next 7 days</StatusPill>
                {state.report ? (
                  <StatusPill tone="success">
                    Last analyzed: {formatDateTime(state.report.analyzedAt)}
                  </StatusPill>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="max-w-3xl text-sm font-medium leading-7 text-slate-800">
                  {statusCopy}
                </p>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">{nextStepCopy}</p>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {calendarSourceSummary.detail}
                </p>
              </div>
              <p>
              </p>
              {googleUiStatus === "provider_access_restricted" ? (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Google Calendar access is currently restricted for this account. Reconnect after
                  access is available, then run a fresh analysis.
                </div>
              ) : null}
              {googleUiStatus === "missing_calendar_access" ? (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  This account is connected without read-only calendar access. Reconnect and
                  approve calendar access to analyze the week.
                </div>
              ) : null}
              {googleUiStatus === "reconnect_needed" ? (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Headroom couldn&apos;t read Google Calendar with the current connection. Reconnect
                  in Settings, then run a fresh analysis.
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 xl:items-end">
              {canAnalyze ? (
                <form action={analyzeWeekAction}>
                  <button
                    type="submit"
                    className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                  >
                    {primaryActionLabel}
                  </button>
                </form>
              ) : (
                <Link
                  href={state.normalizedProfile ? "/settings" : "/onboarding?edit=1"}
                  className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                >
                  {state.normalizedProfile
                    ? googleOAuthConfigured
                      ? "Connect in Settings"
                      : "Finish local OAuth setup"
                    : "Refresh profile"}
                </Link>
              )}
              <Link
                href="/settings"
                className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                Manage included calendars
              </Link>
            </div>
          </div>
        </section>

        {!state.normalizedProfile ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">Profile needed</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Refresh your profile before Headroom can interpret the structure of the week against
              it.
            </p>
          </section>
        ) : !googleOAuthConfigured ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Finish local Google OAuth setup
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Google Calendar analysis is ready in-app, but localhost OAuth credentials are still
              placeholders.
            </p>
          </section>
        ) : googleUiStatus === "not_connected" ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Connect Google Calendar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Headroom reads only the Google calendars you include and only analyzes the next seven
              days.
            </p>
          </section>
        ) : googleUiStatus === "missing_calendar_access" ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Calendar access is missing
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              This Google account is linked, but Headroom does not have read-only calendar access
              for it yet. Reconnect in Settings and approve calendar access.
            </p>
          </section>
        ) : googleUiStatus === "provider_access_restricted" ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Calendar access is restricted
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Google sign-in worked, but this account is not currently allowed to expose calendar
              data here. Check provider access restrictions, then reconnect.
            </p>
          </section>
        ) : googleUiStatus === "reconnect_needed" ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Reconnect Google Calendar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The existing Google connection is no longer usable for a clean read of the week.
              Reconnect in Settings, then run a fresh analysis.
            </p>
          </section>
        ) : state.report ? (
          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              {cognitiveLoadSummary ? (
                <section className="rounded-[30px] border border-white/55 bg-white/88 px-6 py-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                        Week load
                      </p>
                      <h2 className="font-serif text-3xl leading-tight text-slate-950">
                        {cognitiveLoadSummary.label}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-semibold tracking-tight text-slate-950">
                        {cognitiveLoadSummary.score}
                        <span className="ml-1 text-lg font-medium text-slate-500">/100</span>
                      </p>
                      <div className="mt-2 flex justify-end">
                        <StatusPill tone={cognitiveLoadSummary.tone}>
                          {cognitiveLoadSummary.label}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-700">
                    {cognitiveLoadSummary.interpretation}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                        Scheduled load
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {getLoadLabel(cognitiveLoadSummary.scheduledScore)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                        Latent pressure
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatMinutesAsHours(state.report.derivedMetrics.latentDemandMinutes)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/85 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                        Available margin
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatMinutesAsHours(state.report.derivedMetrics.availableMarginMinutes)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    {cognitiveLoadSummary.comparisonLine}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    {cognitiveLoadSummary.supportingLine}
                  </p>
                  {trajectorySummary ? (
                    <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-slate-50/85 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                        Week trajectory
                      </p>
                      <p className="mt-2 text-[15px] leading-7 text-slate-800">
                        {trajectorySummary.headline}
                      </p>
                      {trajectorySummary.details.map((line) => (
                        <p key={line} className="mt-2 text-sm leading-7 text-slate-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {planningStyleRead ? (
                <section className="rounded-[30px] border border-white/55 bg-white/88 px-6 py-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                      {planningStyleRead.title}
                    </p>
                    <h2 className="font-serif text-3xl leading-tight text-slate-950">
                      What this week means for your planning style
                    </h2>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-slate-700">
                    {planningStyleRead.headline}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {planningStyleRead.detail}
                  </p>
                </section>
              ) : null}

              {composition.length > 0 ? (
                <section className="rounded-[30px] border border-white/55 bg-white/88 px-6 py-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                      How your week is composed
                    </p>
                    <h2 className="font-serif text-3xl leading-tight text-slate-950">
                      Week composition
                    </h2>
                  </div>
                  <div className="mt-6 space-y-4">
                    {composition.map((item) => (
                      <article key={item.label} className="space-y-2">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-600">
                            {item.percent}% · {formatMinutesAsHours(item.minutes)}
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900/70"
                            style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                  {compositionInterpretation ? (
                    <p className="mt-6 text-[15px] leading-7 text-slate-700">
                      {compositionInterpretation}
                    </p>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-[30px] border border-slate-900/10 bg-slate-950 px-6 py-6 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.7)]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Interventions
                  </p>
                  <h2 className="font-serif text-3xl leading-tight text-white">
                    How to change the trajectory
                  </h2>
                </div>
                {balanceFeedback.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {balanceFeedback.slice(0, 2).map((item) => (
                      <p key={item.title} className="text-sm leading-7 text-slate-300">
                        <span className="font-semibold text-white">{item.title}:</span> {item.text}
                      </p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-6 space-y-4">
                  {interventions.map((suggestion, index) => (
                    <article key={`${index}-${suggestion.label}`} className="flex items-start gap-4">
                      <span className="theme-accent-text text-sm font-semibold">
                        0{index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {suggestion.label}
                        </p>
                        <p className="text-sm leading-7 text-slate-200">{suggestion.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-[30px] border border-white/55 bg-white/86 px-5 py-5 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.42)] backdrop-blur">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                    Daily load trajectory
                  </p>
                  <h2 className="font-serif text-2xl leading-tight text-slate-950">
                    How capacity shifts across the week
                  </h2>
                </div>
                <div className="mt-5">
                  <DailyLoadTrajectory days={state.report.derivedMetrics.dailyLoadScores} />
                </div>
                {recoveryIslands ? (
                  <div className="mt-6 border-t border-slate-200/80 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                          Recovery islands
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          A visual read of where the week already holds movement, support, and breathable unplanned time.
                        </p>
                      </div>
                      <Link
                        href={openCalendarHref}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                      >
                        Open in Google Calendar
                      </Link>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-700">{recoveryIslands.summary}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {recoveryIslands.supportingLine}
                    </p>
                    <div className="mt-4">
                      <RecoveryIslandsVisual days={recoveryIslands.days} />
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">No report yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Run your first fresh read of the week from the calendars you include in Settings. If a cached
              report exists later, the dashboard will show it until you re-analyze or it expires.
            </p>
          </section>
        )}

        {showLoadDebug && state.report ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.35)]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                Load debug
              </p>
              <h2 className="font-serif text-2xl leading-tight text-slate-900">
                Temporary scoring breakdown
              </h2>
              <p className="text-sm leading-7 text-slate-700">
                Debug view for the current analyzed week. This is development-only and shows the
                raw scoring components before display scaling.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="pr-4">Day</th>
                    <th className="pr-4">Demand</th>
                    <th className="pr-4">Eval</th>
                    <th className="pr-4">Latent</th>
                    <th className="pr-4">Pre-exam</th>
                    <th className="pr-4">Support</th>
                    <th className="pr-4">Transition</th>
                    <th className="pr-4">Fragmentation</th>
                    <th className="pr-4">Compression</th>
                    <th className="pr-4">Open support</th>
                    <th className="pr-4">Carryover</th>
                    <th className="pr-4">Raw</th>
                    <th>Display</th>
                  </tr>
                </thead>
                <tbody>
                  {state.report.derivedMetrics.dailyLoadDebug.map((day) => (
                    <tr key={day.date.toISOString()} className="rounded-[16px] bg-white/80 text-slate-800">
                      <td className="rounded-l-[16px] px-3 py-2 font-semibold">{day.label}</td>
                      <td className="px-3 py-2">{day.demandSubtotal.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.evaluativeLoadSubtotal.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.latentDemandSubtotal.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.anticipatoryExamPressure.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.supportSubtotal.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.transitionPenalty.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.fragmentationPenalty.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.compressionPenalty.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.openTimeSupport.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.accumulationCarryover.toFixed(2)}</td>
                      <td className="px-3 py-2">{day.rawScoreBeforeScaling.toFixed(2)}</td>
                      <td className="rounded-r-[16px] px-3 py-2 font-semibold">{day.finalDisplayScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-amber-200 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Weekly breakdown
                </p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <p>Scheduled raw before latent: {state.report.derivedMetrics.weeklyLoadDebug.scheduledWeeklyRawScoreBeforeLatent.toFixed(2)}</p>
                  <p>Evaluative load contribution: {state.report.derivedMetrics.weeklyLoadDebug.evaluativeLoadContribution.toFixed(2)}</p>
                  <p>Anticipatory exam contribution: {state.report.derivedMetrics.weeklyLoadDebug.anticipatoryExamContribution.toFixed(2)}</p>
                  <p>Latent demand contribution: {state.report.derivedMetrics.weeklyLoadDebug.latentDemandContribution.toFixed(2)}</p>
                  <p>Summed daily raw: {state.report.derivedMetrics.weeklyLoadDebug.summedDailyRawScore.toFixed(2)}</p>
                  <p>Average daily raw: {state.report.derivedMetrics.weeklyLoadDebug.averageDailyRawScore.toFixed(2)}</p>
                  <p>Pattern penalties: {state.report.derivedMetrics.weeklyLoadDebug.multiDayPatternPenalties.toFixed(2)}</p>
                  <p>Aggregation penalty: {state.report.derivedMetrics.weeklyLoadDebug.weeklyAggregationPenalty.toFixed(2)}</p>
                  <p>Recovery credits: {state.report.derivedMetrics.weeklyLoadDebug.recoveryCredits.toFixed(2)}</p>
                  <p>Stabilizing credits: {state.report.derivedMetrics.weeklyLoadDebug.weeklyStabilizingCredits.toFixed(2)}</p>
                  <p>Support factor: {state.report.derivedMetrics.weeklyLoadDebug.supportFactor.toFixed(2)}</p>
                  <p>Weekly raw before scaling: {state.report.derivedMetrics.weeklyLoadDebug.weeklyRawScoreBeforeScaling.toFixed(2)}</p>
                  <p>Final weekly display: {state.report.derivedMetrics.weeklyLoadDebug.finalWeeklyDisplayScore}</p>
                </div>
              </div>
              <div className="rounded-[20px] border border-amber-200 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Scaling checks
                </p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <p>Daily scores identical? {new Set(state.report.derivedMetrics.dailyLoadScores.map((day) => day.score)).size === 1 ? "yes" : "no"}</p>
                  <p>More than half identical after scaling? {tooManyIdenticalDisplayScores ? "yes" : "no"}</p>
                  <p>Raw range / display range: {rawRange.toFixed(2)} / {displayRange.toFixed(2)}</p>
                  <p>Raw &gt; 20 with display &lt; 5? {suspiciousRangeCompression ? "yes" : "no"}</p>
                  <p>Raw &gt; 10 with display &lt; 15? {insufficientMidrangeSpread ? "yes" : "no"}</p>
                  <p>Any raw &lt; 10 mapping above 70? {lowRawOverstated ? "yes" : "no"}</p>
                  <p>Any daily score at 99? {state.report.derivedMetrics.dailyLoadScores.some((day) => day.score === 99) ? "yes" : "no"}</p>
                  <p>Weekly at 99? {state.report.derivedMetrics.overallLoadScore === 99 ? "yes" : "no"}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
