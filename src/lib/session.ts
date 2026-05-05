import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USER_EMAIL, ensureDemoUser } from "@/lib/demo-user";
import {
  getAuthModeConfig,
  getServerAuthSession,
  isLocalDevAuthEnabled,
} from "@/lib/auth";

function getRelevantCookieNames(names: string[]) {
  return names.filter((name) =>
    name.includes("next-auth") ||
    name.includes("authjs") ||
    name.includes("profile-save") ||
    name.includes("csrf"),
  );
}

function buildRequestOrigin(headersList: Headers) {
  const origin = headersList.get("origin");
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";

  return origin ?? (host ? `${proto}://${host}` : null);
}

export async function getSessionDebugInfo(context: string, headerStore?: Headers) {
  const session = await getServerAuthSession();
  const cookieStore = await cookies();
  const cookieHeader = headerStore?.get("cookie") ?? null;
  const cookieNames = getRelevantCookieNames(cookieStore.getAll().map((cookie) => cookie.name));
  const user = session?.user ?? null;

  console.info("[auth-debug] session snapshot", {
    context,
    hasSession: Boolean(session),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    requestOrigin: headerStore ? buildRequestOrigin(headerStore) : null,
    referer: headerStore?.get("referer") ?? null,
    cookieHeader,
    hasNextAuthSessionToken:
      cookieStore.has("next-auth.session-token") || cookieStore.has("__Secure-next-auth.session-token"),
    cookieNames,
    cookies: cookieStore.getAll().map(({ name, value }) => ({
      name,
      valuePreview: value.slice(0, 16),
    })),
  });

  return {
    session,
    user,
    cookieNames,
  };
}

export async function requireUser(context = "unknown") {
  const { user } = await getSessionDebugInfo(`requireUser:${context}`);

  if (user?.id) {
    return user;
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

  console.warn("[auth-debug] requireUser redirecting to landing", {
    context,
  });
  redirect("/");
}
