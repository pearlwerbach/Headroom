import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SITE_COPY } from "@/lib/copy";
import { DEMO_USER_EMAIL, ensureAssessmentUser, ensureDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const GOOGLE_CALENDAR_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar.readonly";

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
  effectiveProvider: "assessment" | "google" | "demo";
  ctaLabel: string;
  ctaHref?: string;
}

export type GoogleAuthStartIssueCode =
  | "google_provider_unconfigured"
  | "nextauth_secret_missing"
  | "database_url_missing"
  | "nextauth_url_missing"
  | "nextauth_url_mismatch";

export interface AuthEnvironmentDiagnostics {
  configuredOrigin: string | null;
  requestOrigin: string | null;
  nextAuthUrl: string | null;
  authUrl: string | null;
  vercelUrl: string | null;
  vercelProjectProductionUrl: string | null;
  hasNextAuthSecret: boolean;
  hasDatabaseUrl: boolean;
  hasGoogleClientId: boolean;
  hasGoogleClientSecret: boolean;
}

export function getAuthModeConfig(): AuthModeConfig {
  const googleConfigured = isGoogleOAuthConfigured();
  const localDemoEnabled = isLocalDevAuthEnabled();
  const effectiveProvider = "assessment";

  return {
    googleConfigured,
    localDemoEnabled,
    effectiveProvider,
    ctaLabel: SITE_COPY.shared.COPY_SHARED_AUTH_SIGNIN_DEMO_01,
    ctaHref: "/onboarding?edit=1",
  };
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeMaybeOriginHost(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;

  return normalizeOrigin(normalized);
}

export function getAuthEnvironmentDiagnostics(options?: {
  requestUrl?: string;
}): AuthEnvironmentDiagnostics {
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? null;
  const authUrl = process.env.AUTH_URL ?? null;
  const vercelUrl = process.env.VERCEL_URL ?? null;
  const vercelProjectProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null;

  return {
    configuredOrigin:
      normalizeOrigin(nextAuthUrl) ??
      normalizeOrigin(authUrl) ??
      normalizeMaybeOriginHost(vercelProjectProductionUrl) ??
      normalizeMaybeOriginHost(vercelUrl),
    requestOrigin: normalizeOrigin(options?.requestUrl),
    nextAuthUrl,
    authUrl,
    vercelUrl,
    vercelProjectProductionUrl,
    hasNextAuthSecret: !isPlaceholder(process.env.NEXTAUTH_SECRET),
    hasDatabaseUrl: !isPlaceholder(process.env.DATABASE_URL),
    hasGoogleClientId: hasGoogleClientIdShape(process.env.GOOGLE_CLIENT_ID),
    hasGoogleClientSecret: !isPlaceholder(process.env.GOOGLE_CLIENT_SECRET),
  };
}

export function getGoogleAuthStartIssue(options?: {
  requestUrl?: string;
}): GoogleAuthStartIssueCode | null {
  if (!isGoogleOAuthConfigured()) {
    return "google_provider_unconfigured";
  }

  if (isPlaceholder(process.env.NEXTAUTH_SECRET)) {
    return "nextauth_secret_missing";
  }

  if (isPlaceholder(process.env.DATABASE_URL)) {
    return "database_url_missing";
  }

  const { configuredOrigin, requestOrigin } = getAuthEnvironmentDiagnostics(options);

  if (!configuredOrigin && !requestOrigin) {
    return "nextauth_url_missing";
  }

  if (configuredOrigin && requestOrigin && configuredOrigin !== requestOrigin) {
    return "nextauth_url_mismatch";
  }

  return null;
}

async function preserveGoogleRefreshToken(account: {
  provider?: string | null;
  providerAccountId?: string | null;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  scope?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}) {
  if (account.provider !== "google" || !account.providerAccountId) {
    return;
  }

  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: account.providerAccountId,
      },
    },
    select: {
      refresh_token: true,
      access_token: true,
      expires_at: true,
      scope: true,
      token_type: true,
      id_token: true,
      session_state: true,
    },
  });

  if (!account.refresh_token && existing?.refresh_token) {
    account.refresh_token = existing.refresh_token;
  }

  await prisma.account.updateMany({
    where: {
      provider: "google",
      providerAccountId: account.providerAccountId,
    },
    data: {
      refresh_token: account.refresh_token ?? existing?.refresh_token ?? null,
      access_token: account.access_token ?? existing?.access_token ?? null,
      expires_at: account.expires_at ?? existing?.expires_at ?? null,
      scope: account.scope ?? existing?.scope ?? GOOGLE_CALENDAR_SCOPE,
      token_type: account.token_type ?? existing?.token_type ?? null,
      id_token: account.id_token ?? existing?.id_token ?? null,
      session_state: account.session_state ?? existing?.session_state ?? null,
    },
  });
}

const authMode = getAuthModeConfig();
const providers = [];

providers.push(
  CredentialsProvider({
    id: "assessment",
    name: "Assessment",
    credentials: {},
    async authorize() {
      const user = await ensureAssessmentUser();

      return {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? "Student planner",
      };
    },
  }),
);

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
          scope: GOOGLE_CALENDAR_SCOPE,
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
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers,
  logger: {
    error(code, metadata) {
      console.error("NextAuth error", { code, metadata });
    },
    warn(code) {
      console.warn("NextAuth warning", { code });
    },
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        await preserveGoogleRefreshToken(account);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id =
          (typeof token.id === "string" && token.id) ||
          user?.id ||
          session.user.id;
      }

      return session;
    },
  },
  events: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        await preserveGoogleRefreshToken(account);
      }
    },
    async linkAccount({ account }) {
      if (account.provider === "google") {
        await preserveGoogleRefreshToken(account);
      }
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
