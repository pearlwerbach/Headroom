import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OnboardingLoadingScreen } from "@/components/onboarding-loading-screen";
import { SITE_COPY } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function OnboardingAnalyzingPage() {
  const user = await requireUser();
  const profile = await prisma.workProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      heading={SITE_COPY.onboarding.COPY_ONBOARDING_ANALYZING_HEADING_01}
      userName={user.name}
    >
      <main>
        <OnboardingLoadingScreen />
      </main>
    </AppShell>
  );
}
