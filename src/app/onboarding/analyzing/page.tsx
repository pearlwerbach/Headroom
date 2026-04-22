import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OnboardingLoadingScreen } from "@/components/onboarding-loading-screen";
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
      heading="Analyzing your profile"
      userName={user.name}
    >
      <main>
        <OnboardingLoadingScreen />
      </main>
    </AppShell>
  );
}
