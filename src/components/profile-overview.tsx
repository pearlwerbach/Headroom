import type { ProfileSnapshot } from "@/lib/profile-summary";
import { SITE_COPY } from "@/lib/copy";
import { getProfileDisplayData } from "@/lib/profile-display";

interface ProfileOverviewProps {
  profile: ProfileSnapshot;
  actions?: React.ReactNode;
}

function getSignalPosition(numericValue: number) {
  const clamped = Math.max(1, Math.min(5, numericValue));
  return `${Math.max(0, Math.min(100, 18 + (clamped / 5) * 74))}%`;
}

function SignalMeter({
  label,
  value,
  numericValue,
  implication,
  low,
  high,
}: {
  label: string;
  value: string;
  numericValue: number;
  implication: string;
  low: string;
  high: string;
}) {
  const position = getSignalPosition(numericValue);

  return (
    <article className="rounded-[22px] border border-[rgba(31,41,51,0.06)] bg-white px-5 py-5 shadow-none">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold tracking-[0.01em] text-[rgba(31,41,51,0.88)]">{label}</p>
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[rgba(91,107,115,0.6)]">
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[rgba(31,41,51,0.72)]">{implication}</p>
      <div className="relative mt-4 h-[6px] overflow-visible rounded-full bg-[rgba(31,41,51,0.08)]">
        <div
          className="h-full rounded-full bg-[#8E7FA0]"
          style={{ width: position }}
        />
        <span
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#6F627E]"
          style={{ left: `calc(${position} - 4px)` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] tracking-normal text-[rgba(91,107,115,0.62)]">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </article>
  );
}

export function ProfileOverview({ profile, actions }: ProfileOverviewProps) {
  const display = getProfileDisplayData(profile);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
        <div className="max-w-[900px] space-y-3">
          <h2 className="max-w-full whitespace-nowrap font-serif text-[clamp(1.55rem,2.5vw,2.05rem)] font-medium leading-[1.02] tracking-[-0.01em] text-slate-950">
            {display.title}
          </h2>
          <p className="max-w-[900px] whitespace-normal text-[14px] leading-[1.7] text-slate-700">
            {display.overviewLine}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
        <div className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="mb-4 mt-1">
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                {SITE_COPY.profile.COPY_PROFILE_OVERVIEW_HOW_YOU_WORK_01}
              </p>
          </div>
          {display.metrics.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {display.metrics.map((metric) => (
                <SignalMeter
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  numericValue={metric.numericValue}
                  implication={metric.implication}
                  low={metric.low}
                  high={metric.high}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              {SITE_COPY.profile.COPY_PROFILE_OVERVIEW_EMPTY_SIGNALS_01}
            </p>
          )}
        </div>

        <aside className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                Planning lens
              </p>
              <p className="max-w-[32rem] text-sm leading-6 text-slate-700">{display.description}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(31,41,51,0.06)] bg-[#F5EFE8] px-4 py-4">
              <p className="mb-2 text-[13px] font-semibold tracking-normal text-[rgba(91,107,115,0.7)]">
                {SITE_COPY.profile.COPY_PROFILE_OVERVIEW_WHAT_THIS_MEANS_01}
              </p>
              <p className="font-serif text-[1.45rem] leading-[1.5] text-slate-950">{display.whatThisMeans}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.16fr)]">
        <section className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="mb-4 mt-1">
            <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
              {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_01}
            </p>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            {display.keepInMind.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BAA8D]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="mb-4 mt-1">
            <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
              {SITE_COPY.profile.COPY_PROFILE_OVERVIEW_PLAN_AROUND_01}
            </p>
          </div>
          <ol className="grid gap-4 lg:grid-cols-3">
            {display.planningRules.slice(0, 3).map((rule, index) => (
              <li
                key={rule}
                className="grid grid-cols-[1.6rem_1fr] gap-3 rounded-[20px] border border-[rgba(31,41,51,0.07)] bg-[#FBFAF7] px-4 py-3.5"
              >
                <span className="font-serif text-[1.05rem] leading-6 text-[rgba(31,41,51,0.5)]">{index + 1}.</span>
                <span className="text-sm font-medium leading-6 text-slate-700/90">{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>

      {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
    </div>
  );
}
