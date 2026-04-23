import type { ProfileSnapshot } from "@/lib/profile-summary";
import { getProfileDisplayData } from "@/lib/profile-display";

interface ProfileOverviewProps {
  profile: ProfileSnapshot;
  actions?: React.ReactNode;
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
  return (
    <article className="rounded-[22px] border border-[#e8e2db] bg-white px-4 py-4 shadow-[var(--surface-shadow)]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold tracking-[0.01em] text-slate-900">{label}</p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#866477]">
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{implication}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f3ede6]">
        <div
          className="h-full rounded-full bg-[#b7a9d6]"
          style={{ width: `${(numericValue / 5) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
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
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
            Cognitive subtype
          </p>
          <h2 className="font-serif text-[clamp(1.9rem,3vw,2.7rem)] leading-[1.02] text-slate-950">
            {display.title}
          </h2>
          <p className="max-w-[60ch] text-[15px] leading-7 text-slate-700">
            {display.overviewLine}
          </p>
          <p className="max-w-[58ch] text-sm leading-6 text-slate-600">
            {display.description}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
        <div className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
              How you work
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
            <p className="text-sm leading-6 text-slate-600">No supporting signals are available yet.</p>
          )}
        </div>

        <aside className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
                What this means
              </p>
              <p className="font-serif text-2xl leading-tight text-slate-950">{display.whatThisMeans}</p>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {display.keepInMind.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D8A7A7]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="rounded-[30px] border border-[#e8e2db] bg-white px-5 py-5 shadow-[var(--surface-shadow)]">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6675]">
            How to plan around this
          </p>
        </div>
        <ol className="grid gap-4 lg:grid-cols-3">
          {display.planningRules.slice(0, 3).map((rule, index) => (
            <li
              key={rule}
              className="grid grid-cols-[1.8rem_1fr] gap-3 rounded-[22px] border border-[#e8e2db] bg-[#faf6f1] px-4 py-4"
            >
              <span className="font-serif text-xl leading-7 text-[#866477]">{index + 1}.</span>
              <span className="text-sm font-medium leading-6 text-slate-700">{rule}</span>
            </li>
          ))}
        </ol>
      </section>

      {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
    </div>
  );
}
