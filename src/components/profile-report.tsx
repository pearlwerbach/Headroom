import type { ProfileSnapshot } from "@/lib/profile-summary";
import { SITE_COPY } from "@/lib/copy";
import { getProfileDisplayData } from "@/lib/profile-display";

interface ProfileReportProps {
  profile: ProfileSnapshot;
  actions?: React.ReactNode;
}

function getSignalPosition(numericValue: number) {
  const clamped = Math.max(1, Math.min(5, numericValue));
  return `${Math.max(0, Math.min(100, 18 + (clamped / 5) * 74))}%`;
}

function ReportSignal({
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
    <article className="rounded-[24px] border border-[rgba(31,41,51,0.06)] bg-white px-5 py-5 shadow-none">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold tracking-[0.01em] text-[rgba(31,41,51,0.88)]">{label}</p>
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[rgba(91,107,115,0.6)]">
          {value}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-[rgba(31,41,51,0.72)]">{implication}</p>
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

function BulletList({
  items,
  tone = "rose",
}: {
  items: string[];
  tone?: "rose" | "sage";
}) {
  const dotClassName = tone === "sage" ? "bg-[#7BAA8D]" : "bg-[#D8A7A7]";

  return (
    <ul className="space-y-3 text-[15px] leading-7 text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProfileReport({ profile, actions }: ProfileReportProps) {
  const display = getProfileDisplayData(profile);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[38px] border border-[#e8e2db] bg-white px-7 py-8 shadow-[var(--surface-shadow)] sm:px-8 sm:py-9 lg:px-10">
        <div className="relative max-w-[900px] space-y-4">
          <h1 className="max-w-full whitespace-nowrap font-serif text-[clamp(2rem,3.7vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.015em] text-[#1a2433]">
            {display.title}
          </h1>
          <p className="max-w-[900px] whitespace-normal text-[17px] leading-[1.75] text-slate-700">
            {display.overviewLine}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.88fr)] xl:items-start">
        <div className="rounded-[32px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="mb-5 mt-1 flex items-end justify-between gap-4">
            <div>
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_01}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_BODY_01}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {display.metrics.map((metric) => (
              <ReportSignal
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
        </div>

        <aside className="rounded-[32px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                Planning lens
              </p>
              <p className="max-w-[32rem] text-[15px] leading-7 text-slate-700">{display.description}</p>
            </div>

            <div className="rounded-[24px] border border-[rgba(31,41,51,0.06)] bg-[#F5EFE8] px-4 py-4">
              <p className="text-[13px] font-semibold tracking-normal text-[rgba(91,107,115,0.7)]">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_WHAT_THIS_MEANS_01}
              </p>
              <p className="mt-3 font-serif text-[1.4rem] leading-[1.5] text-[#1c2432]">
                {display.whatThisMeans}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.16fr)] xl:items-start">
        <div className="rounded-[30px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-4">
            <div>
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_01}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_BODY_01}
              </p>
            </div>
            <BulletList items={display.keepInMind.slice(0, 4)} tone="sage" />
          </div>
        </div>

        <div className="rounded-[34px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-5">
            <div>
              <p className="text-[18px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_01}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_BODY_01}
              </p>
            </div>

            <ol className="space-y-4">
              {display.planningRules.slice(0, 3).map((rule, index) => (
                <li
                  key={rule}
                  className="grid grid-cols-[1.8rem_1fr] gap-4 rounded-[20px] border border-[rgba(31,41,51,0.07)] bg-[#FBFAF7] px-4 py-3.5"
                >
                  <span className="font-serif text-[1.25rem] leading-7 text-[rgba(31,41,51,0.5)]">
                    {index + 1}.
                  </span>
                  <span className="text-[15px] font-medium leading-7 text-slate-700/90">{rule}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {actions ? (
        <section className="rounded-[30px] border border-[#e8e2db] bg-white px-6 py-5 shadow-[var(--surface-shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[16px] font-semibold tracking-normal text-[rgba(31,41,51,0.75)]">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_NEXT_STEP_01}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                {SITE_COPY.profile.COPY_PROFILE_REPORT_SECTION_NEXT_STEP_BODY_01}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">{actions}</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
