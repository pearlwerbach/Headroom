import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { OnboardingLoadingScreen } from "@/components/onboarding-loading-screen";
import { SITE_COPY } from "@/lib/copy";
import { getConfiguredLocalOriginRedirect } from "@/lib/local-origin";
import { prisma } from "@/lib/prisma";
import { PROFILE_SAVE_TRACE_COOKIE, PROFILE_SAVE_USER_COOKIE, parseProfileSaveTrace } from "@/lib/profile-save-trace";
import { getSessionDebugInfo, requireUser } from "@/lib/session";

export default async function OnboardingAnalyzingPage() {
  const headerStore = await headers();
  const localOriginRedirect = getConfiguredLocalOriginRedirect(
    headerStore,
    "/onboarding/analyzing",
  );

  if (localOriginRedirect) {
    redirect(localOriginRedirect);
  }

  const sessionDebug = await getSessionDebugInfo("onboardingAnalyzingPage");
  const cookieStore = await cookies();
  const trace = parseProfileSaveTrace(cookieStore.get(PROFILE_SAVE_TRACE_COOKIE)?.value);
  const fallbackUserId = cookieStore.get(PROFILE_SAVE_USER_COOKIE)?.value ?? null;

  console.info("[onboarding-debug] analyzing page load", {
    sessionUserId: sessionDebug.user?.id ?? null,
    fallbackUserId,
    traceProfileId: trace?.persistedProfile?.id ?? null,
  });

  let user = sessionDebug.user ?? null;

  if (!user?.id && !fallbackUserId && !trace?.persistedProfile?.id) {
    user = await requireUser("onboardingAnalyzingPage:noFallback");
  }

  const profile = trace?.persistedProfile?.id
    ? await prisma.workProfile.findUnique({
        where: { id: trace.persistedProfile.id },
      })
    : user?.id || fallbackUserId
      ? await prisma.workProfile.findUnique({
          where: { userId: user?.id ?? fallbackUserId! },
        })
      : null;

  if (!profile) {
    console.warn("[onboarding-debug] analyzing page missing profile, redirecting to onboarding", {
      sessionUserId: sessionDebug.user?.id ?? null,
      fallbackUserId,
      traceProfileId: trace?.persistedProfile?.id ?? null,
    });
    redirect("/onboarding");
  }

  console.info("[onboarding-debug] analyzing page profile resolved", {
    profileId: profile.id,
    subtypeName: profile.subtypeName,
  });

  return (
    <AppShell
      heading={SITE_COPY.onboarding.COPY_ONBOARDING_ANALYZING_HEADING_01}
      userName={user?.name}
    >
      <main>
        <OnboardingLoadingScreen />
      </main>
    </AppShell>
  );
}
