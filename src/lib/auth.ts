import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DEMO_USER_EMAIL, ensureDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

process.env.NEXTAUTH_SECRET ??= process.env.AUTH_SECRET;
process.env.NEXTAUTH_URL ??= process.env.AUTH_URL;

function isPlaceholder(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return true;
  }

  return (
    normalized.startsWith("replace-with-") ||
    normalized.startsWith("your-") ||
    normalized.includes("example") ||
    normalized.includes("placeholder")
  );
}

function hasGoogleClientIdShape(value?: string) {
  const normalized = value?.trim();
  return Boolean(normalized && normalized.endsWith(".apps.googleusercontent.com"));
}

export function isGoogleOAuthConfigured() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return (
    hasGoogleClientIdShape(clientId) &&
    !isPlaceholder(clientSecret)
  );
}

export function isLocalDevAuthEnabled() {
  const flag = process.env.DEV_AUTH_ENABLED?.trim().toLowerCase();

  if (flag === "true") {
    return true;
  }

  if (flag === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export interface AuthModeConfig {
  googleConfigured: boolean;
  localDemoEnabled: boolean;
  effectiveProvider: "google" | "demo";
  ctaLabel: string;
  ctaHref?: string;
}

// Keep provider registration and landing-page CTA selection derived from the same source of truth.
// The homepage bug came from deciding UI mode from `googleConfigured` alone instead of the combined auth mode.
export function getAuthModeConfig(): AuthModeConfig {
  const googleConfigured = isGoogleOAuthConfigured();
  const localDemoEnabled = isLocalDevAuthEnabled();
  // In local development, the app should open into the in-product assessment flow first.
  // Google is treated as an optional calendar connection later in Settings, not the primary
  // landing-page gate.
  const effectiveProvider = localDemoEnabled ? "demo" : "google";

  return {
    googleConfigured,
    localDemoEnabled,
    effectiveProvider,
    ctaLabel: effectiveProvider === "google" ? "Continue with Google" : "Start assessment",
    ctaHref: effectiveProvider === "demo" ? "/onboarding?edit=1" : undefined,
  };
}

const authMode = getAuthModeConfig();
const providers = [];

if (authMode.googleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "missing-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? "missing-google-client-secret",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
  );
}

if (authMode.localDemoEnabled) {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Local demo",
      credentials: {},
      async authorize() {
        const demoUser = await ensureDemoUser();

        return {
          id: demoUser.id,
          email: demoUser.email ?? DEMO_USER_EMAIL,
          name: demoUser.name ?? "Demo Student",
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/",
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
