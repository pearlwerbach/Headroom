import type { RecoveryIslandDay, RecoveryIslandSegment } from "@/components/recovery-islands-visual";
import { DEFAULT_WAKE_HOUR } from "@/lib/constants";
import type { CognitiveProfileSnapshot, WeekAnalysisMetrics, WeekShapeDay } from "@/lib/domain";

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

export function buildPlanningStyleRead(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const pressureLine =
    profile.fragmentationCost >= 4 && safeNumber(metrics.squeezedOpenBlockCount) >= 3
      ? "For your planning style, the biggest pressure is not total hours alone but how many openings are broken into less reliable pieces."
      : profile.transitionCost >= 4 && safeNumber(metrics.transitionDensity) >= 1
        ? "For your planning style, switching cost is likely to matter almost as much as volume this week."
        : profile.overloadSensitivity >= 4 && safeNumber(metrics.loadConcentration) >= 0.35
          ? "For your planning style, the week is more likely to feel tight where demand clusters than from the total weekly hours on their own."
          : "For your planning style, the week is likely to be shaped more by where margin survives than by how much open time exists in theory.";

  const supportLine =
    profile.quietRecoveryValue >= 4 && safeNumber(metrics.recoverySoloMinutes) <= 180
      ? "This subtype usually benefits from quieter reset, and the visible week leaves only a modest amount of that support."
      : profile.exerciseRecoveryValue >= 4 && safeNumber(metrics.exerciseCount) > 0
        ? "This subtype tends to benefit from active reset, and the visible week does at least give exercise a real place in the rhythm."
        : profile.socialRecoveryValue >= 4 && safeNumber(metrics.socialMinutes) > 0
          ? "This subtype can use social support well, so some of the week’s social time may function as genuine recovery when it is not stacked too tightly."
          : "The planning challenge here is less about maximizing output and more about keeping enough usable margin for the subtype you’ve saved.";

  return {
    title: "Through your profile",
    headline: pressureLine,
    detail: supportLine,
  };
}

export function buildRecoveryIslandsInsight(
  metrics: WeekAnalysisMetrics,
  profile: CognitiveProfileSnapshot,
) {
  const days: RecoveryIslandDay[] = metrics.weekShapeDays.map((day) => {
    const segments: RecoveryIslandSegment[] = [];

    for (const segment of day.segments) {
      const durationMinutes = Math.max(0, segment.endMinute - segment.startMinute);

      if (durationMinutes <= 0) {
        continue;
      }

      if (segment.kind === "event") {
        if (segment.eventType === "exercise") {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "exercise",
            emphasis: "steady",
          });
        } else if (segment.eventType === "social") {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "social",
            emphasis: "steady",
          });
        } else if (
          segment.eventType === "meal" ||
          segment.eventType === "personal_care" ||
          segment.eventType === "errand"
        ) {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "care",
            emphasis: "steady",
          });
        }
      }

      if (segment.kind === "open") {
        if (durationMinutes >= 110 && segment.emphasis !== "fragmented") {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "rest",
            emphasis: "steady",
          });
        } else if (durationMinutes >= 45) {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "open",
            emphasis: segment.emphasis === "fragmented" ? "tentative" : "steady",
          });
        }
      }
    }

    const totalRecoveryMinutes = segments.reduce(
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

  const toneMinutes = days.flatMap((day) => day.segments).reduce<Record<RecoveryIslandSegment["tone"], number>>(
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
  const totalRecoveryMinutes = Object.values(toneMinutes).reduce((sum, minutes) => sum + minutes, 0);
  const activeDays = days.filter((day) => day.totalRecoveryMinutes > 0);
  const topDays = [...activeDays]
    .sort((left, right) => right.totalRecoveryMinutes - left.totalRecoveryMinutes)
    .slice(0, 2)
    .map((day) => day.label);

  let summary =
    "Recovery is barely visible in the calendar this week, so most reset will need to be protected intentionally rather than assumed from leftover time.";
  let supportingLine =
    "There is not enough visible support here to do a detailed subtype read, so the safest assumption is that recovery needs deliberate placement.";

  if (totalRecoveryMinutes > 0) {
    summary =
      activeDays.length >= 4
        ? `Visible recovery shows up across much of the week, with the clearest islands around ${formatDayList(topDays)}.`
        : `Visible recovery is present, but it clusters most clearly around ${formatDayList(topDays)}.`;

    if (toneMinutes.exercise > 0 && profile.exerciseRecoveryValue >= 4) {
      supportingLine =
        "Active reset is doing visible work for this subtype, which usually benefits when movement is placed before or after the tighter stretches.";
    } else if (toneMinutes.rest + toneMinutes.care > 0 && profile.quietRecoveryValue >= 4) {
      supportingLine =
        "Quieter recovery is visible here, and for this subtype it is more likely to help when it appears in longer, protected islands rather than only in leftovers.";
    } else if (toneMinutes.social > 0 && profile.socialRecoveryValue >= 4) {
      supportingLine =
        "Social support is part of the recovery picture for this subtype, especially when it is buffered enough to feel like support instead of another transition.";
    } else if (toneMinutes.open > 0) {
      supportingLine =
        "A meaningful share of recovery is coming from unplanned time, which can help this subtype if those openings remain breathable and do not get quietly reassigned.";
    } else {
      supportingLine =
        "Visible recovery exists, but its duration and placement only partially match the way this subtype tends to regain margin.";
    }
  }

  return {
    days,
    summary,
    supportingLine,
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
