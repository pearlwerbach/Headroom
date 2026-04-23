import type { ProfileSnapshot } from "@/lib/profile-summary";
import { getProfileDisplayData } from "@/lib/profile-display";

interface ProfileReportProps {
  profile: ProfileSnapshot;
  actions?: React.ReactNode;
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
  return (
    <article className="rounded-[24px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold tracking-[0.01em] text-slate-900">{label}</p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#866477]">
          {value}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-slate-700">{implication}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f3ede6]">
        <div
          className="h-full rounded-full bg-[#b7a9d6]"
          style={{ width: `${(numericValue / 5) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
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
        <div className="relative max-w-4xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6675]">
            Work &amp; Recovery Profile
          </p>
          <h1 className="font-serif text-[clamp(2.65rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.02em] text-[#1a2433]">
            {display.title}
          </h1>
          <p className="max-w-[56ch] text-lg leading-[1.85] text-slate-700">
            {display.overviewLine}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.88fr)] xl:items-start">
        <div className="rounded-[32px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                How you work
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                These signals stay the same across weeks. They describe the conditions that make
                your time feel usable or deceptively difficult.
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                Cognitive subtype
              </p>
              <h2 className="font-serif text-[2rem] leading-tight text-[#1c2432]">
                {display.title}
              </h2>
              <p className="text-[15px] leading-7 text-slate-700">{display.description}</p>
            </div>

            <div className="rounded-[24px] border border-[#e8e2db] bg-[#faf6f1] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6675]">
                What this means
              </p>
              <p className="mt-3 font-serif text-[1.45rem] leading-tight text-[#1c2432]">
                {display.whatThisMeans}
              </p>
            </div>

            <BulletList items={display.keepInMind.slice(0, 2)} tone="rose" />
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.16fr)] xl:items-start">
        <div className="rounded-[30px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                What to keep in mind
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The patterns most likely to make a week look manageable on paper but feel tighter in practice.
              </p>
            </div>
            <BulletList items={display.keepInMind.slice(0, 4)} tone="sage" />
          </div>
        </div>

        <div className="rounded-[34px] border border-[#e8e2db] bg-white px-6 py-6 shadow-[var(--surface-shadow)]">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                How to plan around this
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use these as stable planning defaults when you decide how much structure, setup,
                and protection a week actually needs.
              </p>
            </div>

            <ol className="space-y-4">
              {display.planningRules.slice(0, 3).map((rule, index) => (
                <li
                  key={rule}
                  className="grid grid-cols-[2rem_1fr] gap-4 rounded-[24px] border border-[#e8e2db] bg-[#faf6f1] px-4 py-4"
                >
                  <span className="font-serif text-[1.45rem] leading-8 text-[#866477]">
                    {index + 1}.
                  </span>
                  <span className="text-[15px] font-medium leading-7 text-slate-700">{rule}</span>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                Next step
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Keep this profile as your planning reference. Use it to interpret the dashboard,
                protect the right kind of time, and adjust when the week starts to tighten.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">{actions}</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
