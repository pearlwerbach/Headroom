import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { SITE_COPY } from "@/lib/copy";
import {
  getAuthModeConfig,
  getServerAuthSession,
} from "@/lib/auth";

export default async function Home() {
  const session = await getServerAuthSession();
  const authMode = getAuthModeConfig();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="theme-page-wash pointer-events-none absolute inset-0" />
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-10 lg:px-10">
        <header className="rounded-[32px] border border-slate-200/80 bg-[rgba(225,229,236,0.72)] px-6 py-4 text-slate-900 shadow-[0_28px_70px_-60px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700 sm:text-base">
                  HEADROOM
                </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-baseline lg:gap-6">
              <div>
                <h1 className="font-serif text-3xl leading-tight text-slate-900">
                  {SITE_COPY.landing.COPY_LANDING_HEADER_HEADLINE_01}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight text-slate-950">
                {SITE_COPY.landing.COPY_LANDING_HERO_HEADLINE_01}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {SITE_COPY.landing.COPY_LANDING_HERO_BODY_01}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              {authMode.effectiveProvider === "google" ? (
                <AuthButton
                  mode="signin"
                  provider="google"
                  label={authMode.ctaLabel}
                  className="px-6 py-3.5 text-base"
                />
              ) : (
                <AuthButton
                  mode="signin"
                  provider="demo"
                  label={authMode.ctaLabel}
                  href={authMode.ctaHref}
                  className="px-6 py-3.5 text-base"
                />
              )}
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_38px_100px_-52px_rgba(15,23,42,0.95)]">
            <div className="grid gap-4">
              <div className="rounded-[28px] bg-white/6 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="theme-accent-text text-xs uppercase tracking-[0.24em]">
                      {SITE_COPY.landing.COPY_LANDING_REPORT_EYEBROW_01}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl">
                      {SITE_COPY.landing.COPY_LANDING_REPORT_HEADLINE_01}
                    </h2>
                  </div>
                  <div className="theme-accent-badge rounded-full px-3 py-2 text-sm">
                    {SITE_COPY.landing.COPY_LANDING_REPORT_BADGE_01}
                  </div>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-slate-300">
                  {SITE_COPY.landing.COPY_LANDING_REPORT_METRICS.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3"
                    >
                      <span>{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="theme-accent-panel rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                  {SITE_COPY.landing.COPY_LANDING_SIGNAL_EYEBROW_01}
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {SITE_COPY.landing.COPY_LANDING_SIGNAL_HEADLINE_01}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {SITE_COPY.landing.COPY_LANDING_SIGNAL_BODY_01}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-5">
            <p className="max-w-3xl font-serif text-3xl leading-tight text-slate-900 sm:text-[2rem]">
              {SITE_COPY.landing.COPY_LANDING_FEATURES_HEADLINE_01}
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {SITE_COPY.landing.COPY_LANDING_FEATURES.map(({ title, body }, index) => (
              <article
                key={title}
                className="theme-accent-card rounded-[28px] border p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.28)]"
              >
                <p className="mb-4 text-sm font-semibold text-[var(--color-accent-strong)]">
                  0{index + 1}
                </p>
                <h2 className="font-serif text-2xl text-slate-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="rounded-[28px] border border-white/70 bg-white/80 px-6 py-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)]">
            <div className="max-w-2xl">
              <p className="font-serif text-3xl leading-tight text-slate-900 sm:text-[2rem]">
                {SITE_COPY.landing.COPY_LANDING_INPUTS_HEADLINE_01}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SITE_COPY.landing.COPY_LANDING_INPUT_LABELS.map((label) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
