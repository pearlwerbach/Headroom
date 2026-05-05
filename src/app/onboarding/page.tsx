import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AssessmentAccessGate } from "@/components/assessment-access-gate";
import { AppShell } from "@/components/app-shell";
import { OnboardingQuiz } from "@/components/onboarding-quiz";
import { ProfileReport } from "@/components/profile-report";
import { getServerAuthSession, isGoogleOAuthConfigured } from "@/lib/auth";
import { SITE_COPY } from "@/lib/copy";
import { getConfiguredLocalOriginRedirect } from "@/lib/local-origin";
import { prisma } from "@/lib/prisma";
import { PROFILE_SAVE_TRACE_COOKIE, PROFILE_SAVE_USER_COOKIE, parseProfileSaveTrace } from "@/lib/profile-save-trace";

function buildRequestOrigin(headersList: Headers) {
  const origin = headersList.get("origin");
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";

  return origin ?? (host ? `${proto}://${host}` : null);
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const session = await getServerAuthSession();
  const user = session?.user ?? null;
  const params = searchParams ? await searchParams : undefined;
  const editMode = params?.edit === "1";
  const completeMode = params?.complete === "1";
  const traceMode = params?.trace === "1";
  const returnTo = params?.returnTo === "settings" ? "settings" : "onboarding";
  const headerStore = await headers();
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string") {
      search.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          search.append(key, item);
        }
      }
    }
  }
  const localOriginRedirect = getConfiguredLocalOriginRedirect(
    headerStore,
    `/onboarding${search.size ? `?${search.toString()}` : ""}`,
  );

  if (localOriginRedirect) {
    redirect(localOriginRedirect);
  }

  const cookieStore = await cookies();
  const trace = parseProfileSaveTrace(cookieStore.get(PROFILE_SAVE_TRACE_COOKIE)?.value);
  const fallbackUserId = cookieStore.get(PROFILE_SAVE_USER_COOKIE)?.value ?? null;
  const fallbackProfileId = trace?.persistedProfile?.id ?? null;

  const [profile, googleAccount] = user?.id
    ? await Promise.all([
        prisma.workProfile.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.account.findFirst({
          where: { userId: user.id, provider: "google" },
          select: { id: true },
        }),
      ])
    : fallbackProfileId
      ? [
          await prisma.workProfile.findUnique({
            where: { id: fallbackProfileId },
          }),
          null,
        ]
      : fallbackUserId
        ? [
            await prisma.workProfile.findUnique({
              where: { userId: fallbackUserId },
            }),
            null,
          ]
        : [null, null];
  const showConnectGoogleAction = !googleAccount;
  const googleOAuthConfigured = isGoogleOAuthConfigured();

  console.info("[onboarding-debug] page load", {
    pathname: "/onboarding",
    editMode,
    completeMode,
    traceMode,
    requestOrigin: buildRequestOrigin(headerStore),
    referer: headerStore.get("referer"),
    cookieHeader: headerStore.get("cookie"),
    hasNextAuthSessionToken:
      cookieStore.has("next-auth.session-token") || cookieStore.has("__Secure-next-auth.session-token"),
    cookies: cookieStore.getAll().map(({ name, value }) => ({
      name,
      valuePreview: value.slice(0, 16),
    })),
    sessionUserId: user?.id ?? null,
    sessionUserEmail: user?.email ?? null,
    fallbackUserId,
    fallbackProfileId,
    resolvedProfileId: profile?.id ?? null,
    resolvedSubtypeName: profile?.subtypeName ?? null,
    showResult: Boolean(profile && !editMode),
  });

  return (
    <>
      {profile && !editMode ? (
        <AppShell
          heading="Work & Recovery Profile"
          userName={user?.name}
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
                    {showConnectGoogleAction ? (
                      <Link
                        href="/settings"
                        className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                      >
                        Connect Google Calendar to map this profile onto your real week.
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                      >
                        {SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_01}
                      </Link>
                    )}
                    <Link
                      href={showConnectGoogleAction && googleOAuthConfigured ? "/dashboard" : "/settings"}
                      className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                    >
                      {showConnectGoogleAction
                        ? SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_01
                        : SITE_COPY.onboarding.COPY_ONBOARDING_PROFILE_ACTION_02}
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
            <div className="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen border-b border-[rgba(31,41,51,0.08)] bg-[#4F4654]">
              <header className="mx-auto w-full max-w-7xl px-6 py-6 text-[#F8F7F5] sm:px-8 lg:px-10">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-4xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(248,247,245,0.74)] sm:text-base">
                      {SITE_COPY.onboarding.COPY_ONBOARDING_BRAND_01}
                    </p>

                    <div className="mt-3 border-t border-white/10 pt-3">
                      <h1 className="max-w-3xl whitespace-nowrap font-serif text-[clamp(2.75rem,3.5vw,3.125rem)] leading-[1.02] tracking-tight text-[#F8F7F5]">
                        {SITE_COPY.onboarding.COPY_ONBOARDING_HERO_HEADLINE_01}
                      </h1>

                      <p className="mt-3 max-w-xl text-sm text-[rgba(248,247,245,0.72)] sm:text-[15px]">
                        {SITE_COPY.onboarding.COPY_ONBOARDING_HERO_BODY_01}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/"
                    className="mt-0.5 shrink-0 rounded-full px-3 py-2 text-sm font-medium text-[rgba(248,247,245,0.78)] transition hover:text-[#F8F7F5]"
                  >
                    Back to home
                  </Link>
                </div>
              </header>
            </div>

            <main className="relative z-10 mt-6 flex justify-center px-0 pb-6 sm:mt-8 lg:mt-10 lg:pb-8">
              <div className="w-full max-w-5xl">
                {user ? (
                  <OnboardingQuiz returnTo={editMode ? returnTo : undefined} />
                ) : (
                  <AssessmentAccessGate>
                    <OnboardingQuiz returnTo={editMode ? returnTo : undefined} />
                  </AssessmentAccessGate>
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
