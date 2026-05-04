import { unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { SITE_COPY } from "@/lib/copy";
import { requireUser } from "@/lib/session";
import { getWeekAnalysisHistory, type WeekAnalysisHistoryEntry } from "@/lib/week-analysis";
import { formatDateTime } from "@/lib/utils";

function getLoadLabel(score: number) {
  if (score >= 72) {
    return SITE_COPY.history.COPY_HISTORY_LOADLABEL_HEAVY_01;
  }

  if (score >= 45) {
    return SITE_COPY.history.COPY_HISTORY_LOADLABEL_TIGHT_01;
  }

  return SITE_COPY.history.COPY_HISTORY_LOADLABEL_BALANCED_01;
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
    return SITE_COPY.history.COPY_HISTORY_COMPARISON_EARLIEST_01;
  }

  const loadDelta = current.overallLoadScore - previous.overallLoadScore;
  const committedDelta =
    current.derivedMetrics.totalCommittedMinutes - previous.derivedMetrics.totalCommittedMinutes;
  const openDelta = current.derivedMetrics.totalOpenMinutes - previous.derivedMetrics.totalOpenMinutes;

  const loadRead =
    loadDelta >= 8
      ? SITE_COPY.history.COPY_HISTORY_COMPARISON_LOAD_UP_01
      : loadDelta <= -8
        ? SITE_COPY.history.COPY_HISTORY_COMPARISON_LOAD_DOWN_01
        : SITE_COPY.history.COPY_HISTORY_COMPARISON_LOAD_STEADY_01;
  const committedRead =
    committedDelta >= 120
      ? SITE_COPY.history.COPY_HISTORY_COMPARISON_COMMITTED_UP_01(formatHours(committedDelta))
      : committedDelta <= -120
        ? SITE_COPY.history.COPY_HISTORY_COMPARISON_COMMITTED_DOWN_01(formatHours(Math.abs(committedDelta)))
        : SITE_COPY.history.COPY_HISTORY_COMPARISON_COMMITTED_STEADY_01;
  const openRead =
    openDelta >= 120
      ? SITE_COPY.history.COPY_HISTORY_COMPARISON_OPEN_UP_01(formatHours(openDelta))
      : openDelta <= -120
        ? SITE_COPY.history.COPY_HISTORY_COMPARISON_OPEN_DOWN_01(formatHours(Math.abs(openDelta)))
        : SITE_COPY.history.COPY_HISTORY_COMPARISON_OPEN_STEADY_01;

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
              {SITE_COPY.history.COPY_HISTORY_EYEBROW_01}
            </p>
            <h1 className="font-serif text-4xl leading-tight text-slate-950">
              {SITE_COPY.history.COPY_HISTORY_TITLE_01}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {SITE_COPY.history.COPY_HISTORY_BODY_01}
            </p>
          </div>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[28px] border border-white/55 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              {SITE_COPY.history.COPY_HISTORY_EMPTY_TITLE_01}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {SITE_COPY.history.COPY_HISTORY_EMPTY_BODY_01}
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
                        {SITE_COPY.history.COPY_HISTORY_SAVED_AT_01(formatDateTime(entry.analyzedAt))}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        {SITE_COPY.history.COPY_HISTORY_LOAD_BADGE_01(entry.overallLoadScore)}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                        {SITE_COPY.history.COPY_HISTORY_COMMITTED_BADGE_01(
                          formatHours(entry.derivedMetrics.totalCommittedMinutes),
                        )}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                        {SITE_COPY.history.COPY_HISTORY_OPEN_BADGE_01(
                          formatHours(entry.derivedMetrics.totalOpenMinutes),
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 max-w-4xl text-[15px] leading-7 text-slate-700">
                    {buildComparison(entry, previous)}
                  </p>

                  <div className="mt-6">
                    <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-strong)]">
                        {SITE_COPY.history.COPY_HISTORY_SNAPSHOT_01}
                      </p>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                        <p>{SITE_COPY.history.COPY_HISTORY_SNAPSHOT_WORK_01(formatHours(entry.derivedMetrics.workClassMinutes))}</p>
                        <p>{SITE_COPY.history.COPY_HISTORY_SNAPSHOT_MEETINGS_01(formatHours(entry.derivedMetrics.meetingsStructuredMinutes))}</p>
                        <p>{SITE_COPY.history.COPY_HISTORY_SNAPSHOT_RECOVERY_01(formatHours(entry.derivedMetrics.recoverySoloMinutes))}</p>
                        <p>{SITE_COPY.history.COPY_HISTORY_SNAPSHOT_SOCIAL_01(formatHours(entry.derivedMetrics.socialMinutes))}</p>
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
