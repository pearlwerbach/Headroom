import { getProfileModel, type ProfileSnapshot } from "@/lib/profile-summary";
import { getSubtypePresentation } from "@/lib/profile-presentation";
import type { SubtypeName } from "@/lib/profile-model";
import type { ProfileSaveTrace } from "@/lib/profile-save-trace";
import type { ProfileWriteTraceEntry } from "@/lib/profile-write-trace";

interface ProfileOverviewProps {
  profile: ProfileSnapshot;
  actions?: React.ReactNode;
  saveTrace?: ProfileSaveTrace | null;
  profileWriteTrace?: ProfileWriteTraceEntry[];
}

export function ProfileOverview({
  profile,
  actions,
  saveTrace,
  profileWriteTrace = [],
}: ProfileOverviewProps) {
  const model = getProfileModel(profile);
  const showDebugPanel = process.env.PROFILE_MODEL_DEBUG === "true";
  const title = model.profileName ?? "Cognitive profile";
  const overviewLine = getSubtypePresentation(title as SubtypeName).overviewLine;
  const metrics: Array<{
    key: string;
    label: string;
    value: number | string;
    low?: string;
    high?: string;
    implication?: string;
  }> = model.signals.map((signal) => ({
    key: signal.key,
    label: signal.label,
    value: signal.value,
    low: "Low",
    high: "High",
    implication: signal.description,
  }));
  const visibleCardPayload = {
    subtypeTitle: title,
    overviewLine,
    supportingSignals: model.signals.map((signal) => ({
      label: signal.label,
      value: signal.value,
      description: signal.description,
    })),
  };
  const profilePropUsedForRendering = {
    id: profile.id,
    updatedAt: profile.updatedAt?.toISOString?.() ?? String(profile.updatedAt),
    rawAnswers: profile.rawAnswers,
    modelVersion: profile.modelVersion,
    subtypeName: profile.subtypeName,
    subtypeDescription: profile.subtypeDescription,
    shortSummary: profile.shortSummary,
    overloadSensitivity: profile.overloadSensitivity,
    fragmentationCost: profile.fragmentationCost,
    transitionCost: profile.transitionCost,
    deepWorkCapacity: profile.deepWorkCapacity,
    ambiguityTolerance: profile.ambiguityTolerance,
    routinePreference: profile.routinePreference,
    socialRecoveryValue: profile.socialRecoveryValue,
    exerciseRecoveryValue: profile.exerciseRecoveryValue,
    quietRecoveryValue: profile.quietRecoveryValue,
    overcommitmentRisk: profile.overcommitmentRisk,
    preferredRecoveryModes: profile.preferredRecoveryModes,
    blockNeed: profile.blockNeed,
    switchingCost: profile.switchingCost,
    setupLoad: profile.setupLoad,
    socialSpillover: profile.socialSpillover,
    passiveReset: profile.passiveReset,
    socialReset: profile.socialReset,
    physicalReset: profile.physicalReset,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-slate-950 px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="max-w-5xl space-y-3">
          <p className="theme-accent-text text-xs font-semibold uppercase tracking-[0.24em]">
            Cognitive profile
          </p>
          <div className="space-y-2.5">
            <h1 className="font-serif text-[clamp(2rem,4vw,3.4rem)] leading-[0.98] text-white">
              {title}
            </h1>
            <p className="max-w-[60ch] text-base leading-[1.85] text-slate-300 lg:text-[15px] xl:text-base">
              {overviewLine}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            How you work
          </p>
        </div>

        {metrics.length ? (
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {metrics.map((metric) => {
              const numericValue =
                typeof metric.value === "number"
                  ? metric.value
                  : metric.value === "High"
                    ? 5
                    : metric.value === "Medium"
                      ? 3
                      : 1;
              return (
                <div
                  key={metric.key ?? metric.label}
                  className="border-b border-slate-200/70 pb-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold tracking-[0.01em] text-slate-900">
                      {metric.label ?? metric.key ?? "Signal"}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {metric.value}
                    </span>
                  </div>
                  {metric.implication ? (
                    <p className="mt-3 text-[15px] leading-7 text-slate-700">
                      {metric.implication}
                    </p>
                  ) : null}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="theme-progress-bar h-full rounded-full"
                      style={{ width: `${(numericValue / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    <span>{metric.low ?? "Low"}</span>
                    <span>{metric.high ?? "High"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            No supporting signals are available yet.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/55 px-5 py-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              What to keep in mind
            </p>
          </div>

          <ul className="space-y-3 text-[15px] leading-7 text-slate-700">
            {model.keepInMind.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-[0_22px_70px_-60px_rgba(15,23,42,0.45)]">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              How to plan around this
            </p>
          </div>

          <ol className="space-y-4">
            {model.planningRules.slice(0, 3).map((rule, index) => (
              <li key={rule} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-serif text-xl leading-7 text-slate-400">
                  {index + 1}.
                </span>
                <span className="text-[15px] font-medium leading-7 text-slate-700">
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {showDebugPanel && saveTrace ? (
        <section className="rounded-[26px] border border-slate-200 bg-white/80 p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
              Latest save trace
            </p>
            <p className="text-sm text-slate-600">
              This is the actual retake submission payload and the saved row the page just rendered.
            </p>
          </div>

          <pre className="mt-5 overflow-x-auto rounded-[16px] bg-slate-50 p-3 text-xs leading-6 text-slate-700">
            {JSON.stringify(
              {
                submittedRawAnswers: saveTrace.submittedRawAnswers,
                computedProfileBeforeWrite: saveTrace.computedProfileBeforeWrite,
                dbWritePayload: saveTrace.dbWritePayload,
                canonicalVariables: saveTrace.canonicalVariables,
                subtypeName: saveTrace.subtypeName,
                persistedProfile: saveTrace.persistedProfile,
                postWriteRow: saveTrace.postWriteRow,
                visibleSupportingSignals: model.signals.map((signal) => ({
                  label: signal.label,
                  value: signal.value,
                  description: signal.description,
                })),
              },
              null,
              2,
            )}
          </pre>
        </section>
      ) : null}

      {showDebugPanel ? (
        <section className="rounded-[26px] border border-amber-200 bg-amber-50/80 p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Visible card runtime trace
            </p>
            <p className="text-sm text-amber-900/80">
              This is the exact prop object and final rendered payload used by the visible Profile card.
            </p>
          </div>

          <pre className="mt-5 overflow-x-auto rounded-[16px] bg-white p-3 text-xs leading-6 text-slate-700">
            {JSON.stringify(
              {
                component: "ProfileOverview",
                visibleCardUsesProp: "profile",
                exactProfilePropUsedForRendering: profilePropUsedForRendering,
                branchTakenInGetProfileModel: model.debug.branchTaken,
                renderSource: model.debug.renderSource,
                rawLoadedProfile: model.debug.rawLoadedProfile,
                renderedProfileFromModel: model.debug.renderedProfile,
                finalRenderedCardPayload: visibleCardPayload,
              },
              null,
              2,
            )}
          </pre>
        </section>
      ) : null}

      {showDebugPanel && profileWriteTrace.length ? (
        <section className="rounded-[26px] border border-rose-200 bg-rose-50/80 p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Profile write trace
            </p>
            <p className="text-sm text-rose-900/80">
              Recent `WorkProfile` writes touching this profile row.
            </p>
          </div>

          <pre className="mt-5 overflow-x-auto rounded-[16px] bg-white p-3 text-xs leading-6 text-slate-700">
            {JSON.stringify(profileWriteTrace, null, 2)}
          </pre>
        </section>
      ) : null}

      {showDebugPanel && model.debug ? (
        <section className="rounded-[26px] border border-slate-200 bg-white/80 p-5">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                  Model debug
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Developer-only scoring view for validating the explicit profile model.
                </p>
              </div>
              <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                {model.debug.isLegacy ? "Legacy profile" : "V1 model"}
              </span>
            </summary>

            <div className="mt-5 space-y-5 border-t border-slate-200 pt-5">
              <pre className="overflow-x-auto rounded-[16px] bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                {JSON.stringify(
                  {
                    branchTaken: model.debug.branchTaken,
                    renderSource: model.debug.renderSource,
                    rawLoadedProfile: model.debug.rawLoadedProfile,
                    loadedProfile: model.debug.loadedProfile,
                    renderedProfile: model.debug.renderedProfile,
                    isLegacy: model.debug.isLegacy,
                    legacyMessage: model.debug.legacyMessage,
                    rawAnswers: model.debug.rawAnswers,
                    modelVersion: model.debug.modelVersion,
                    variables: model.debug.variables,
                    riskFlags: model.debug.riskFlags,
                    subtypeName: model.debug.subtypeName,
                    subtypeScoreBreakdown: model.debug.subtypeScoreBreakdown,
                    subtypeSupport: model.debug.subtypeSupport,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </details>
        </section>
      ) : null}

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
