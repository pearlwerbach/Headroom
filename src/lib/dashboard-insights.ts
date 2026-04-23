import type { RecoveryIslandDay, RecoveryIslandSegment } from "@/components/recovery-islands-visual";
import { DEFAULT_WAKE_HOUR } from "@/lib/constants";
import type { CognitiveProfileSnapshot, WeekAnalysisMetrics } from "@/lib/domain";

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
      return "Movement";
    case "social":
      return "Social support";
    case "care":
      return "Meals / care";
    case "rest":
      return "Rest block";
    case "open":
    default:
      return "Open margin";
  }
}

function formatClockTime(totalMinutesFromWake: number) {
  const absoluteMinutes = DEFAULT_WAKE_HOUR * 60 + totalMinutesFromWake;
  const hour24 = Math.floor(absoluteMinutes / 60);
  const minute = absoluteMinutes % 60;
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${minute.toString().padStart(2, "0")} ${meridiem}`;
}

function formatTimeRange(startMinute: number, endMinute: number) {
  return `${formatClockTime(startMinute)} - ${formatClockTime(endMinute)}`;
}

function getRecoveryDisplayLabel(
  tone: RecoveryIslandSegment["tone"],
  startMinute: number,
  durationMinutes: number,
) {
  switch (tone) {
    case "exercise":
      if (startMinute < 180) {
        return "Morning movement";
      }
      return durationMinutes >= 75 ? "Movement block" : "Movement break";
    case "social":
      return durationMinutes >= 75 ? "Community time" : "Social support";
    case "care":
      return startMinute < 180 ? "Slow morning" : "Meals / care";
    case "rest":
      if (startMinute >= 600) {
        return "Evening reset";
      }
      return startMinute < 180 ? "Quiet morning" : "Reset block";
    case "open":
    default:
      return "Breathing room";
  }
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
            displayLabel: getRecoveryDisplayLabel("exercise", segment.startMinute, durationMinutes),
            timeLabel: durationMinutes >= 35 ? formatTimeRange(segment.startMinute, segment.endMinute) : undefined,
          });
        } else if (segment.eventType === "social") {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "social",
            emphasis: "steady",
            displayLabel: getRecoveryDisplayLabel("social", segment.startMinute, durationMinutes),
            timeLabel: durationMinutes >= 35 ? formatTimeRange(segment.startMinute, segment.endMinute) : undefined,
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
            displayLabel: getRecoveryDisplayLabel("care", segment.startMinute, durationMinutes),
            timeLabel: durationMinutes >= 35 ? formatTimeRange(segment.startMinute, segment.endMinute) : undefined,
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
            displayLabel: getRecoveryDisplayLabel("rest", segment.startMinute, durationMinutes),
            timeLabel: durationMinutes >= 45 ? formatTimeRange(segment.startMinute, segment.endMinute) : undefined,
          });
        } else if (durationMinutes >= 45) {
          segments.push({
            startMinute: segment.startMinute,
            endMinute: segment.endMinute,
            tone: "open",
            emphasis: segment.emphasis === "fragmented" ? "tentative" : "steady",
            displayLabel: durationMinutes >= 70 ? getRecoveryDisplayLabel("open", segment.startMinute, durationMinutes) : undefined,
            timeLabel:
              durationMinutes >= 75 && segment.emphasis !== "fragmented"
                ? formatTimeRange(segment.startMinute, segment.endMinute)
                : undefined,
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
  const detectableRecoveryBlockCount = days.reduce((sum, day) => sum + day.segments.length, 0);
  const topDays = [...activeDays]
    .sort((left, right) => right.totalRecoveryMinutes - left.totalRecoveryMinutes)
    .slice(0, 2)
    .map((day) => day.label);
  const mostRestorativeDay =
    [...activeDays].sort((left, right) => right.totalRecoveryMinutes - left.totalRecoveryMinutes)[0] ?? null;
  const dominantRecoveryModes = (
    Object.entries(toneMinutes) as Array<[RecoveryIslandSegment["tone"], number]>
  )
    .filter(([, minutes]) => minutes > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([tone]) => getRecoveryModeLabel(tone));

  let summary =
    "Recovery is barely visible in the calendar this week, so most reset will need to be protected intentionally rather than assumed from leftover time.";
  let supportingLine =
    "There is not enough visible support here to do a detailed subtype read, so the safest assumption is that recovery needs deliberate placement.";
  let meaningTitle = "What this means";
  let meaningLines = [
    "Visible recovery is still fairly light, so whatever support exists here matters more than it might seem.",
    "The most useful move is to keep at least some of it from being quietly reassigned to more work.",
  ];
  const idealRecoveryLine = getIdealRecoveryLine(profile);

  if (totalRecoveryMinutes > 0) {
    if (toneMinutes.open > 0 && toneMinutes.exercise + toneMinutes.social + toneMinutes.care + toneMinutes.rest === 0) {
      summary =
        activeDays.length >= 3
          ? `Some recovery is showing up mainly as breathable open space, with the clearest room around ${formatDayList(topDays)}.`
          : `A small amount of recovery is visible mainly as open margin, especially around ${formatDayList(topDays)}.`;
      meaningTitle = "Breathing room";
      meaningLines = [
        "Most of the visible support here is unplanned space rather than explicit recovery blocks.",
        "That can still help, especially if those openings stay breathable instead of absorbing extra work by default.",
      ];
    } else {
      summary =
        activeDays.length >= 4
          ? `Visible recovery shows up across much of the week, with the clearest islands around ${formatDayList(topDays)}.`
          : `Visible recovery is present, but it clusters most clearly around ${formatDayList(topDays)}.`;
      meaningTitle = "What this means";
      meaningLines =
        detectableRecoveryBlockCount >= 4
          ? [
              "You have visible recovery touchpoints across the week, which gives your capacity somewhere to land before the next tighter stretch.",
              "The main planning job is to keep those islands intact rather than treating them as optional extras.",
            ]
          : [
              "Some real support is visible here, even if it is not carrying the whole week on its own.",
              "That still matters, because it shows the schedule is making at least a little room for restoration instead of only throughput.",
            ];
    }

    if (toneMinutes.exercise > 0 && profile.exerciseRecoveryValue >= 4) {
      supportingLine =
        "Active reset is doing visible work here, which is a meaningful way for this profile to protect bandwidth before or after tighter stretches.";
    } else if (toneMinutes.rest + toneMinutes.care > 0 && profile.quietRecoveryValue >= 4) {
      supportingLine =
        "Quieter recovery is visible here, and for this profile it is more likely to help when it appears in longer, protected islands rather than only in leftovers.";
    } else if (toneMinutes.social > 0 && profile.socialRecoveryValue >= 4) {
      supportingLine =
        "Social support is part of the recovery picture here, especially when it is buffered enough to feel restorative instead of like another transition.";
    } else if (toneMinutes.open > 0) {
      supportingLine =
        "A meaningful share of recovery is coming from unplanned time, which can help if those openings stay breathable and do not get quietly reassigned to more work.";
    } else {
      supportingLine =
        "Visible recovery exists, and it suggests at least some intention to protect bandwidth even if those blocks are still relatively light.";
    }
  }

  return {
    days,
    summary,
    supportingLine,
    idealRecoveryLine,
    meaningTitle,
    meaningLines,
    detectableRecoveryBlockCount,
    visibleRecoveryDayCount: activeDays.length,
    totalRecoveryMinutes,
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
