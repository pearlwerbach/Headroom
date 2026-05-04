import { unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { analyzePreviousWeekHistoryAction } from "@/app/actions/week-analysis";
import { HistoryFeedbackControls } from "@/components/history-feedback-controls";
import { SITE_COPY } from "@/lib/copy";
import { requireUser } from "@/lib/session";
import { getWeekAnalysisHistory, type WeekAnalysisHistoryEntry } from "@/lib/week-analysis";

function getLoadLabel(score: number) {
  if (score >= 72) {
    return SITE_COPY.history.COPY_HISTORY_LOADLABEL_HEAVY_01;
  }

  if (score >= 45) {
    return SITE_COPY.history.COPY_HISTORY_LOADLABEL_TIGHT_01;
  }

  return SITE_COPY.history.COPY_HISTORY_LOADLABEL_BALANCED_01;
}

function getLoadTone(score: number) {
  if (score >= 72) {
    return "border-[#C9969D] bg-[#F4E1E2] text-[#74454C]";
  }

  if (score >= 45) {
    return "border-[#D1B06C] bg-[#F6EACF] text-[#785725]";
  }

  return "border-[#AFC6B5] bg-[#E6EFE8] text-[#3F5E4B]";
}

function formatRange(start: Date, end: Date) {
  const inclusiveEnd = new Date(end.getTime() - 86400000);
  const sameMonth = start.getMonth() === inclusiveEnd.getMonth() && start.getFullYear() === inclusiveEnd.getFullYear();

  return sameMonth
    ? `${format(start, "MMM d")}–${format(inclusiveEnd, "d")}`
    : `${format(start, "MMM d")}–${format(inclusiveEnd, "MMM d")}`;
}

function formatHours(minutes: number) {
  if (minutes <= 0) {
    return "0h";
  }

  const hours = minutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function describeDelta(
  delta: number,
  singular: string,
  positiveVerb: string,
  negativeVerb: string,
) {
  if (Math.abs(delta) < 60) {
    return `${singular} stayed close`;
  }

  const direction = delta > 0 ? positiveVerb : negativeVerb;
  return `${singular} ${direction} by ${formatHours(Math.abs(delta))}`;
}

function buildComparison(current: WeekAnalysisHistoryEntry, previous: WeekAnalysisHistoryEntry | null) {
  if (!previous) {
    return "This is the earliest saved week in your history so far.";
  }

  const loadDelta = current.overallLoadScore - previous.overallLoadScore;
  const committedDelta =
    current.derivedMetrics.totalCommittedMinutes - previous.derivedMetrics.totalCommittedMinutes;
  const openDelta = current.derivedMetrics.totalOpenMinutes - previous.derivedMetrics.totalOpenMinutes;
  const recoveryDelta =
    current.derivedMetrics.recoverySoloMinutes - previous.derivedMetrics.recoverySoloMinutes;

  const loadRead =
    Math.abs(loadDelta) >= 6
      ? `Load ${loadDelta > 0 ? "rose" : "fell"} by ${Math.abs(loadDelta)} points`
      : "Load stayed close";

  const deltas = [
    {
      magnitude: Math.abs(committedDelta),
      text: describeDelta(committedDelta, "committed time", "rose", "fell"),
    },
    {
      magnitude: Math.abs(openDelta),
      text: describeDelta(openDelta, "open time", "expanded", "narrowed"),
    },
    {
      magnitude: Math.abs(recoveryDelta),
      text: describeDelta(recoveryDelta, "recovery", "increased", "decreased"),
    },
  ]
    .filter((item) => item.magnitude >= 60)
    .sort((left, right) => right.magnitude - left.magnitude);

  if (deltas.length === 0) {
    return `${loadRead}, and time stayed close to the week before.`;
  }

  if (deltas.length === 1) {
    return `${loadRead}, and ${deltas[0].text}.`;
  }

  return `${loadRead}, while ${deltas[0].text} and ${deltas[1].text}.`;
}

function getPlanningPattern(entry: WeekAnalysisHistoryEntry) {
  const metrics = entry.derivedMetrics;

  if (metrics.fragmentationBurden >= 3 || metrics.freeBlockCount60 <= 2) {
    return "Fragmented work blocks";
  }

  if (metrics.loadConcentration >= 0.34) {
    return "Committed time clustered into one stretch";
  }

  if (metrics.recoverySoloMinutes >= 600) {
    return "Recovery stayed visible across the week";
  }

  if (metrics.totalOpenMinutes >= 2400) {
    return "Open time stayed visibly available across the week";
  }

  return "The week stayed relatively even";
}

const METRIC_MAX_MINUTES = {
  workClass: 50 * 60,
  meetings: 15 * 60,
  social: 20 * 60,
  recovery: 30 * 60,
  open: 70 * 60,
} as const;

function getMetricPercent(minutes: number, maxMinutes: number) {
  if (minutes <= 0) {
    return 0;
  }

  return Math.max(10, Math.min(100, Math.round((minutes / maxMinutes) * 100)));
}

export default async function HistoryPage() {
  noStore();
  const user = await requireUser();
  const history = await getWeekAnalysisHistory(user.id);

  return (
    <AppShell heading="History" userName={user.name}>
      <main className="space-y-9">
        <section>
          <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
            Compare how your weeks carry load, time, and recovery.
          </p>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[26px] border border-[rgba(31,41,51,0.08)] bg-[#FBFAF7] px-7 py-7 shadow-[0_1px_2px_rgba(31,41,51,0.03)]">
            <div className="space-y-3">
              <h2 className="font-serif text-[2rem] leading-tight text-slate-900">No history yet</h2>
              <p className="max-w-2xl text-[15px] leading-7 text-slate-600">
                Generate a previous-week summary to compare how your schedule changed.
              </p>
            </div>
            <form action={analyzePreviousWeekHistoryAction} className="mt-6">
              <button
                type="submit"
                className="inline-flex h-[54px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(to_bottom,#6F8B7A_0%,#5F7D6D_100%)] px-8 text-[15px] font-semibold tracking-[0.01em] text-[#FAF8F3] shadow-[0_10px_22px_rgba(45,68,55,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:-translate-y-[1px] hover:bg-[#557263] hover:shadow-[0_14px_26px_rgba(45,68,55,0.2),inset_0_1px_0_rgba(255,255,255,0.16)] active:translate-y-0 active:bg-[#4E685B] active:shadow-[0_7px_14px_rgba(45,68,55,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                Compare to last week
              </button>
            </form>
          </section>
        ) : (
          <section className="space-y-5">
            {history.map((entry, index) => {
              const previous = history[index + 1] ?? null;
              const metricItems = [
                {
                  label: "Work & class",
                  value: entry.derivedMetrics.workClassMinutes,
                  max: METRIC_MAX_MINUTES.workClass,
                },
                {
                  label: "Meetings",
                  value: entry.derivedMetrics.meetingsStructuredMinutes,
                  max: METRIC_MAX_MINUTES.meetings,
                },
                {
                  label: "Social",
                  value: entry.derivedMetrics.socialMinutes,
                  max: METRIC_MAX_MINUTES.social,
                },
                {
                  label: "Recovery",
                  value: entry.derivedMetrics.recoverySoloMinutes,
                  max: METRIC_MAX_MINUTES.recovery,
                },
              ];

              return (
                <article
                  key={`${entry.weekStart.toISOString()}-${entry.weekEnd.toISOString()}`}
                  className="rounded-[26px] border border-[rgba(31,41,51,0.08)] bg-[#FBFAF7] px-7 py-8 shadow-[0_1px_2px_rgba(31,41,51,0.03)]"
                >
                  <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {formatRange(entry.weekStart, entry.weekEnd)}
                      </p>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-semibold ${getLoadTone(entry.overallLoadScore)}`}
                      >
                        <span className="font-semibold text-[rgba(31,41,51,0.95)]">{getLoadLabel(entry.overallLoadScore)}</span>
                        <span className="opacity-70">·</span>
                        <span>{entry.overallLoadScore}/100</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="rounded-full border border-[rgba(31,41,51,0.08)] bg-white px-3.5 py-2 text-[14px] text-slate-700">
                        {formatHours(entry.derivedMetrics.totalCommittedMinutes)} committed
                      </div>
                      <div className="rounded-full border border-[rgba(31,41,51,0.08)] bg-white px-3.5 py-2 text-[14px] text-slate-700">
                        {formatHours(entry.derivedMetrics.totalOpenMinutes)} open
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    <p className="text-[16px] leading-7 text-[rgba(31,41,51,0.85)]">{buildComparison(entry, previous)}</p>

                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                      {metricItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[18px] border border-[rgba(31,41,51,0.06)] bg-[rgba(31,41,51,0.04)] px-3.5 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-normal text-slate-500">{item.label}</p>
                            <p className="text-[13px] font-semibold text-slate-800">
                              {formatHours(item.value)}
                            </p>
                          </div>
                          <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-[rgba(31,41,51,0.08)]">
                            <div
                              className="h-full rounded-full bg-[#2C2A3A]"
                              style={{ width: `${getMetricPercent(item.value, item.max)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <HistoryFeedbackControls
                      weekStart={entry.weekStart.toISOString()}
                      weekEnd={entry.weekEnd.toISOString()}
                      feltLoad={entry.feedback.feltLoad}
                      recoveryQuality={entry.feedback.recoveryQuality}
                    />

                    <div className="pt-1">
                      <p className="text-[14px] leading-6 text-[rgba(91,107,115,0.72)]">
                        <span className="font-medium">Primary pattern:</span>{" "}
                        <span className="font-medium text-[rgba(31,41,51,0.82)]">
                          {getPlanningPattern(entry)}
                        </span>
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </AppShell>
  );
}
