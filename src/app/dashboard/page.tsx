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
import {
  getGoogleCalendarUiStatus,
  getIncludedCalendarsSummary,
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
      ? "Connected"
      : googleUiStatus === "reconnect_needed"
        ? "Reconnect needed"
        : googleUiStatus === "missing_calendar_access"
          ? "Calendar access missing"
          : googleUiStatus === "provider_access_restricted"
            ? "Provider access restricted"
            : "Not connected";
  const primaryActionLabel = hasReport ? "Re-analyze Week" : "Analyze My Week";
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
        <section className="rounded-[28px] border border-[#E3E6EA] bg-[#EEF1F4] px-5 py-4 text-[#2C2A3A] shadow-[var(--surface-shadow)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <h1 className="font-serif text-[2rem] leading-tight text-[#2C2A3A]">
                Analyze My Week
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                <StatusPill>{calendarSourceSummary.label}</StatusPill>
                {state.report ? (
                  <StatusPill>
                    Last analyzed: {formatDateTime(state.report.analyzedAt)}
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
                      ? "Connect in Settings"
                      : "Finish local OAuth setup"
                    : "Refresh profile"}
                </Link>
              )}
            </div>
          </div>
        </section>

        {!state.normalizedProfile ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">Profile needed</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Refresh your profile before Headroom can interpret the structure of the week against
              it.
            </p>
          </section>
        ) : !googleOAuthConfigured ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Finish local Google OAuth setup
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Google Calendar analysis is ready in-app, but localhost OAuth credentials are still
              placeholders.
            </p>
          </section>
        ) : googleUiStatus === "not_connected" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Connect Google Calendar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Headroom reads only the Google calendars you include and only analyzes the next seven
              days.
            </p>
          </section>
        ) : googleUiStatus === "missing_calendar_access" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              Calendar access is missing
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              This Google account is linked, but Headroom does not have read-only calendar access
              for it yet. Reconnect in Settings and approve calendar access.
            </p>
          </section>
        ) : googleUiStatus === "provider_access_restricted" ? (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
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
          <section className="space-y-8">
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

            <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              {subtypePresentation ? (
                <section className="rounded-[34px] border border-[#E8E2DB] bg-white px-7 py-7 shadow-[var(--surface-shadow)] backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7d6677]">
                      Cognitive subtype
                    </p>
                    <h2 className="font-serif text-[2rem] leading-tight text-slate-950">
                      {subtypePresentation.name}
                    </h2>
                  </div>
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-700">
                    {subtypePresentation.overviewLine}
                  </p>
                  {subtypeBullets.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d6677]">
                        What this means this week
                      </p>
                      <ul className="space-y-2.5 text-sm leading-7 text-slate-700">
                        {subtypeBullets.slice(0, 2).map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-[#D8A7A7]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              ) : (
                <div />
              )}

              {composition.length > 0 ? (
                <section className="rounded-[32px] border border-[#E3E6EA] bg-[#EEF1F4] px-7 py-7 shadow-[var(--surface-shadow)] backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a7457]">
                      How your week is composed
                    </p>
                    <h2 className="font-serif text-[2rem] leading-tight text-slate-950">
                      Week composition
                    </h2>
                  </div>
                  <div className="mt-6 space-y-4">
                    {composition.map((item) => (
                      <article key={item.label} className="space-y-2.5">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-right text-sm tabular-nums text-slate-600">
                            {item.percent}% · {formatMinutesAsHours(item.minutes)}
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-[#2C2A3A]"
                            style={{ width: `${item.percent <= 0 ? 0 : Math.min(100, item.percent)}%` }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                  {compositionInterpretation ? (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                      {compositionInterpretation}
                    </p>
                  ) : null}
                </section>
              ) : (
                <div />
              )}
            </section>

            <section>
              {recoveryIslands && recoveryIslands.detectableRecoveryBlockCount >= 2 ? (
                <section className="rounded-[32px] border border-[#E8E2DB] bg-[linear-gradient(180deg,rgba(252,249,245,0.98),rgba(247,242,235,0.92))] px-6 py-6 shadow-[var(--surface-shadow)] backdrop-blur xl:mx-auto xl:max-w-[76rem] xl:px-8 xl:py-8">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] xl:items-start">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f7b85]">
                          Recovery islands
                        </p>
                        <h2 className="font-serif text-[1.95rem] leading-tight text-slate-900">
                          Where support is already visible
                        </h2>
                      </div>
                      <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
                        {recoveryIslands.summary}
                      </p>
                      <p className="max-w-3xl text-[15px] leading-7 text-slate-600">
                        {recoveryIslands.supportingLine}
                      </p>
                    </div>

                    <aside className="rounded-[24px] border border-[#E8E2DB] bg-[rgba(255,255,255,0.62)] px-5 py-5">
                      <p className="text-sm font-semibold text-slate-900">
                        {recoveryIslands.meaningTitle}
                      </p>
                      <div className="mt-3 space-y-3">
                        {recoveryIslands.meaningLines.map((line) => (
                          <p key={line} className="text-[15px] leading-7 text-slate-700">
                            {line}
                          </p>
                        ))}
                      </div>
                      <p className="mt-4 text-[13px] leading-6 text-[#6b7b68]">
                        {recoveryIslands.idealRecoveryLine}
                      </p>
                    </aside>
                  </div>

                  <div className="mt-7">
                    <RecoveryIslandsVisual days={recoveryIslands.days} />
                  </div>

                  <div className="mt-7 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
                    <div className="rounded-[22px] border border-[#E8E2DB] bg-[rgba(255,255,255,0.72)] px-5 py-4">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                            Total recovery time
                          </p>
                          <p className="mt-2 font-serif text-[2rem] leading-none text-slate-900">
                            {Math.round((recoveryIslands.totalRecoveryMinutes / 60) * 10) / 10}h
                          </p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500">
                            across the week
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                            Most restorative day
                          </p>
                          <p className="mt-2 font-serif text-[1.75rem] leading-none text-slate-900">
                            {recoveryIslands.mostRestorativeDay?.label ?? "None yet"}
                          </p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500">
                            {recoveryIslands.mostRestorativeDay
                              ? `${formatMinutesAsHours(recoveryIslands.mostRestorativeDay.totalRecoveryMinutes)} visible`
                              : "No visible island"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <RecoveryLegendCard />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] leading-6 text-slate-500">
                    {recoveryIslands.dominantRecoveryModes.length > 0 ? (
                      <span>
                        Most visible support: {recoveryIslands.dominantRecoveryModes.join(" and ")}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-center">
                      These are islands, not quotas. Small moments add up.
                    </span>
                  </div>
                </section>
              ) : (
                <div />
              )}
            </section>

            {cognitiveLoadSummary && cognitiveLoadSummary.score > 85 ? (
              <section className="rounded-[32px] border border-[#E8E2DB] bg-white px-7 py-7 text-slate-900 shadow-[var(--surface-shadow)]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#866477]">
                    Interventions
                  </p>
                  <h2 className="font-serif text-3xl leading-tight text-slate-950">
                    How to change the trajectory
                  </h2>
                </div>
                {balanceFeedback.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {balanceFeedback.slice(0, 2).map((item) => (
                      <p key={item.title} className="text-sm leading-7 text-slate-600">
                        <span className="font-semibold text-slate-900">{item.title}:</span> {item.text}
                      </p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-6 space-y-4">
                  {interventions.map((suggestion, index) => (
                    <article key={`${index}-${suggestion.label}`} className="flex items-start gap-4">
                      <span className="text-sm font-semibold text-[#866477]">
                        0{index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {suggestion.label}
                        </p>
                        <p className="text-sm leading-7 text-slate-700">{suggestion.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        ) : (
          <section className="rounded-[28px] border border-[#E8E2DB] bg-white p-6 shadow-[var(--surface-shadow)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">No report yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Run your first fresh read of the week from the calendars you include in Settings. If a cached
              report exists later, the dashboard will show it until you re-analyze or it expires.
            </p>
          </section>
        )}
      </main>
    </AppShell>
  );
}
