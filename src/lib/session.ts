import { redirect } from "next/navigation";
import { DEMO_USER_EMAIL, ensureDemoUser } from "@/lib/demo-user";
import {
  getAuthModeConfig,
  getServerAuthSession,
  isLocalDevAuthEnabled,
} from "@/lib/auth";

export async function requireUser() {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    return session.user;
  }

  if (
    isLocalDevAuthEnabled() &&
    getAuthModeConfig().effectiveProvider === "demo"
  ) {
    const demoUser = await ensureDemoUser();

    return {
      id: demoUser.id,
      email: demoUser.email ?? DEMO_USER_EMAIL,
      name: demoUser.name ?? "Demo Student",
    };
  }

  redirect("/");
}
