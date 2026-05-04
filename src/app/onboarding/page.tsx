import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/app-shell";
import { OnboardingQuiz } from "@/components/onboarding-quiz";
import { ProfileReport } from "@/components/profile-report";
import { SITE_COPY } from "@/lib/copy";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const editMode = params?.edit === "1";
  const completeMode = params?.complete === "1";
  const returnTo = params?.returnTo === "settings" ? "settings" : "onboarding";
  const profile = await prisma.workProfile.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      {profile && !editMode ? (
        <AppShell
          heading="Work & Recovery Profile"
          userName={user.name}
          variant="profileReport"
        >
          <main>
            <div className="space-y-4">
              {completeMode ? (
                <div className="inline-flex rounded-full border border-[#e3d6c8] bg-[rgba(255,249,242,0.94)] px-4 py-2 text-sm font-semibold text-[#7f6754]">
                  {SITE_COPY.onboarding.COPY_ONBOARDING_SAVED_BADGE_01}
                </div>
              ) : null}
              <ProfileReport
                profile={profile}
                actions={
                  <>
                    <Link
                      href="/dashboard"
                      className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                    >
                      {SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_01}
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                    >
                      {SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_02}
                    </Link>
                    <Link
                      href="/onboarding?edit=1&returnTo=onboarding"
                      className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                    >
                      {SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_04}
                    </Link>
                  </>
                }
              />
            </div>
          </main>
        </AppShell>
      ) : (
        <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="theme-shell-wash pointer-events-none absolute inset-0" />

          <div className="relative mx-auto w-full max-w-7xl">
            <header className="rounded-[32px] border border-slate-200/70 bg-slate-950 px-6 py-6 text-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.75)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
              <div className="max-w-4xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/90">
                  {SITE_COPY.onboarding.COPY_ONBOARDING_BRAND_01}
                </p>

                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <h1 className="max-w-3xl font-serif text-[clamp(2rem,3.2vw,3rem)] leading-[0.98] tracking-tight text-white">
                    {SITE_COPY.onboarding.COPY_ONBOARDING_HERO_HEADLINE_01}
                  </h1>

                  <p className="max-w-xl text-sm text-slate-300 sm:text-[15px]">
                    {SITE_COPY.onboarding.COPY_ONBOARDING_HERO_BODY_01}
                  </p>
                </div>
              </div>
            </header>

            <main className="relative z-10 mt-6 flex justify-center px-0 pb-6 sm:mt-8 lg:mt-10 lg:pb-8">
              <div className="w-full max-w-5xl">
                <OnboardingQuiz returnTo={editMode ? returnTo : undefined} />
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
