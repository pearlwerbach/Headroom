import { unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { getWeekAnalysisHistory, type WeekAnalysisHistoryEntry } from "@/lib/week-analysis";
import { formatDateTime } from "@/lib/utils";

function getLoadLabel(score: number) {
  if (score >= 72) {
    return "Heavy";
  }

  if (score >= 45) {
    return "Tight";
  }

  return "Balanced";
}

function formatRange(start: Date, end: Date) {
  return `${format(start, "MMM d")}–${format(new Date(end.getTime() - 86400000), "MMM d")}`;
}

function formatHours(minutes: number) {
  if (minutes <= 0) {
    return "0h";
  }

  const hours = minutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
}

function buildComparison(
  current: WeekAnalysisHistoryEntry,
  previous: WeekAnalysisHistoryEntry | null,
) {
  if (!previous) {
    return "This is the earliest saved week in your history so far.";
  }

  const loadDelta = current.overallLoadScore - previous.overallLoadScore;
  const committedDelta =
    current.derivedMetrics.totalCommittedMinutes - previous.derivedMetrics.totalCommittedMinutes;
  const openDelta = current.derivedMetrics.totalOpenMinutes - previous.derivedMetrics.totalOpenMinutes;

  const loadRead =
    loadDelta >= 8
      ? "The overall load climbed noticeably from the week before."
      : loadDelta <= -8
        ? "The overall load eased meaningfully from the week before."
        : "The overall load stayed fairly close to the week before.";
  const committedRead =
    committedDelta >= 120
      ? `Committed time rose by about ${formatHours(committedDelta)}.`
      : committedDelta <= -120
        ? `Committed time fell by about ${formatHours(Math.abs(committedDelta))}.`
        : "Committed time stayed in a similar range.";
  const openRead =
    openDelta >= 120
      ? `Open time expanded by about ${formatHours(openDelta)}.`
      : openDelta <= -120
        ? `Open time narrowed by about ${formatHours(Math.abs(openDelta))}.`
        : "Open time stayed broadly similar.";

  return `${loadRead} ${committedRead} ${openRead}`;
}

export default async function HistoryPage() {
  noStore();
  const user = await requireUser();
  const history = await getWeekAnalysisHistory(user.id);

  return (
    <AppShell heading="History" userName={user.name}>
      <main className="space-y-8">
        <section className="rounded-[30px] border border-white/60 bg-white/86 px-6 py-6 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              Week to week
            </p>
            <h1 className="font-serif text-4xl leading-tight text-slate-950">
              Compare how your weeks are carrying
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              Headroom keeps a lightweight summary of prior analyzed weeks so you can compare load,
              openness, and planning conditions over time without storing raw event names.
            </p>
          </div>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">No history yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              No previous weekly analysis exists yet. Come back in seven days to review how your
              planning compares week to week.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {history.map((entry: WeekAnalysisHistoryEntry, index: number) => {
              const previous = history[index + 1] ?? null;

              return (
                <article
                  key={entry.id}
                  className="rounded-[28px] border border-white/55 bg-white/88 px-6 py-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.48)] backdrop-blur"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                        {formatRange(entry.weekStart, entry.weekEnd)}
                      </p>
                      <h2 className="font-serif text-3xl leading-tight text-slate-950">
                        {getLoadLabel(entry.overallLoadScore)}
                      </h2>
                      <p className="text-sm leading-7 text-slate-600">
                        Saved {formatDateTime(entry.analyzedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        {entry.overallLoadScore}/99 load
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                        {formatHours(entry.derivedMetrics.totalCommittedMinutes)} committed
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                        {formatHours(entry.derivedMetrics.totalOpenMinutes)} open
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 max-w-4xl text-[15px] leading-7 text-slate-700">
                    {buildComparison(entry, previous)}
                  </p>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-strong)]">
                        What stood out
                      </p>
                      {entry.observations.slice(0, 2).map((line: string) => (
                        <p key={line} className="text-sm leading-7 text-slate-700">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-strong)]">
                        Snapshot
                      </p>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                        <p>
                          Work / class: {formatHours(entry.derivedMetrics.workClassMinutes)}
                        </p>
                        <p>
                          Meetings / structured: {formatHours(entry.derivedMetrics.meetingsStructuredMinutes)}
                        </p>
                        <p>
                          Recovery / solo: {formatHours(entry.derivedMetrics.recoverySoloMinutes)}
                        </p>
                        <p>Social: {formatHours(entry.derivedMetrics.socialMinutes)}</p>
                      </div>
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
