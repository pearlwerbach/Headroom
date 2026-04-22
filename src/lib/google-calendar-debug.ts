import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_DAYS } from "@/lib/constants";

const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export type GoogleCalendarReadStatus =
  | "success"
  | "insufficientPermissions"
  | "admin_policy_or_access_denied"
  | "refresh_failure"
  | "invalid_credentials"
  | "not_connected"
  | "unknown_error";

export interface GoogleAccountDebugRow {
  email: string | null;
  scopes: string[];
  hasRefreshToken: boolean;
  providerAccountId: string;
  updatedAt: Date;
}

interface GoogleAccountDiagnosticResult {
  email: string | null;
  scopes: string[];
  hasRefreshToken: boolean;
  providerAccountId: string;
  updatedAt: Date;
  status: GoogleCalendarReadStatus;
  httpStatus?: number;
  statusText?: string;
  errorMessage?: string;
  errorBody?: unknown;
}

function isLocalDebugEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.PROFILE_MODEL_DEBUG === "true";
}

function assertLocalDebugAllowed() {
  if (!isLocalDebugEnabled()) {
    throw new Error("Google Calendar debug helpers are local-only.");
  }
}

function splitScopes(scope?: string | null) {
  return (scope ?? "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function classifyCalendarError(
  httpStatus: number,
  errorBody: unknown,
): GoogleCalendarReadStatus {
  const reason = typeof errorBody === "object" && errorBody && "error" in errorBody
    ? (errorBody as {
        error?: {
          errors?: Array<{ reason?: string; message?: string }>;
          status?: string;
          message?: string;
        };
      }).error?.errors?.[0]?.reason
    : undefined;
  const message = typeof errorBody === "object" && errorBody && "error" in errorBody
    ? (errorBody as {
        error?: {
          message?: string;
        };
      }).error?.message
    : undefined;

  if (reason === "insufficientPermissions" || message?.includes("insufficient authentication scopes")) {
    return "insufficientPermissions";
  }

  if (
    reason === "authError" ||
    message?.includes("invalid authentication credentials")
  ) {
    return "invalid_credentials";
  }

  if (
    httpStatus === 403 &&
    (reason === "accessNotConfigured" ||
      reason === "forbidden" ||
      message?.toLowerCase().includes("admin") ||
      message?.toLowerCase().includes("access denied"))
  ) {
    return "admin_policy_or_access_denied";
  }

  return "unknown_error";
}

async function refreshAccessTokenForAccount(account: {
  id: string;
  refresh_token: string | null;
}) {
  if (!account.refresh_token) {
    return {
      ok: false as const,
      status: "refresh_failure" as const,
      errorMessage: "Missing refresh token.",
      errorBody: null,
    };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false as const,
      status: "refresh_failure" as const,
      httpStatus: response.status,
      statusText: response.statusText,
      errorMessage:
        typeof body === "object" &&
        body &&
        "error_description" in body &&
        typeof (body as { error_description?: unknown }).error_description === "string"
          ? (body as { error_description: string }).error_description
          : "Unable to refresh Google Calendar access token.",
      errorBody: body,
    };
  }

  const payload = body as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: payload.access_token,
      expires_at: Math.floor(Date.now() / 1000 + payload.expires_in),
      refresh_token: payload.refresh_token ?? account.refresh_token,
    },
  });

  return {
    ok: true as const,
    accessToken: payload.access_token,
  };
}

async function getUsableAccessToken(account: {
  id: string;
  access_token: string | null;
  expires_at: number | null;
  refresh_token: string | null;
}) {
  if (!account.access_token) {
    return {
      ok: false as const,
      status: "not_connected" as const,
      errorMessage: "Missing access token.",
      errorBody: null,
    };
  }

  const expiresSoon = Boolean(account.expires_at && account.expires_at < Date.now() / 1000 + 60);

  if (!expiresSoon) {
    return {
      ok: true as const,
      accessToken: account.access_token,
    };
  }

  return refreshAccessTokenForAccount(account);
}

export async function listGoogleAccountDebugRows(): Promise<GoogleAccountDebugRow[]> {
  assertLocalDebugAllowed();

  const rows = await prisma.account.findMany({
    where: {
      provider: "google",
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      providerAccountId: true,
      scope: true,
      refresh_token: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    email: row.user.email,
    scopes: splitScopes(row.scope),
    hasRefreshToken: Boolean(row.refresh_token),
    providerAccountId: row.providerAccountId,
    updatedAt: row.updatedAt,
  }));
}

export async function diagnoseGoogleCalendarReadForEmail(
  email: string,
): Promise<GoogleAccountDiagnosticResult> {
  assertLocalDebugAllowed();

  const account = await prisma.account.findFirst({
    where: {
      provider: "google",
      user: {
        email,
      },
    },
    select: {
      id: true,
      providerAccountId: true,
      scope: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!account) {
    return {
      email,
      scopes: [],
      hasRefreshToken: false,
      providerAccountId: "",
      updatedAt: new Date(0),
      status: "not_connected",
      errorMessage: "No saved Google account row.",
    };
  }

  const scopes = splitScopes(account.scope);
  const base = {
    email: account.user.email,
    scopes,
    hasRefreshToken: Boolean(account.refresh_token),
    providerAccountId: account.providerAccountId,
    updatedAt: account.updatedAt,
  };

  if (!scopes.includes(CALENDAR_READONLY_SCOPE)) {
    return {
      ...base,
      status: "insufficientPermissions",
      errorMessage: "Saved Google account row is missing calendar.readonly scope.",
    };
  }

  const tokenResult = await getUsableAccessToken(account);

  if (!tokenResult.ok) {
    return {
      ...base,
      status: tokenResult.status,
      httpStatus: "httpStatus" in tokenResult ? tokenResult.httpStatus : undefined,
      statusText: "statusText" in tokenResult ? tokenResult.statusText : undefined,
      errorMessage: tokenResult.errorMessage,
      errorBody: tokenResult.errorBody,
    };
  }

  const params = new URLSearchParams({
    calendarId: "primary",
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: new Date().toISOString(),
    timeMax: addDays(new Date(), DASHBOARD_DAYS).toISOString(),
    maxResults: "10",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
      },
      cache: "no-store",
    },
  );

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ...base,
      status: classifyCalendarError(response.status, body),
      httpStatus: response.status,
      statusText: response.statusText,
      errorMessage:
        typeof body === "object" &&
        body &&
        "error" in body &&
        typeof (body as { error?: { message?: unknown } }).error?.message === "string"
          ? ((body as { error: { message: string } }).error.message)
          : "Calendar read failed.",
      errorBody: body,
    };
  }

  return {
    ...base,
    status: "success",
  };
}

export async function removeLocalGoogleAccountState(options: {
  mode: "stale_missing_scope" | "user";
  userId?: string;
}) {
  assertLocalDebugAllowed();

  if (options.mode === "stale_missing_scope") {
    const rows = await prisma.account.findMany({
      where: {
        provider: "google",
      },
      select: {
        userId: true,
        scope: true,
      },
    });

    const staleUserIds = rows
      .filter((row) => !splitScopes(row.scope).includes(CALENDAR_READONLY_SCOPE))
      .map((row) => row.userId);

    if (staleUserIds.length === 0) {
      return { removedAccounts: 0, removedReports: 0, removedCalendarRows: 0 };
    }

    const [accounts, reports, calendarRows] = await prisma.$transaction([
      prisma.account.deleteMany({
        where: {
          provider: "google",
          userId: {
            in: staleUserIds,
          },
        },
      }),
      prisma.weekAnalysisReport.deleteMany({
        where: {
          userId: {
            in: staleUserIds,
          },
        },
      }),
      prisma.calendarEvent.deleteMany({
        where: {
          source: "google",
          userId: {
            in: staleUserIds,
          },
        },
      }),
    ]);

    return {
      removedAccounts: accounts.count,
      removedReports: reports.count,
      removedCalendarRows: calendarRows.count,
    };
  }

  if (!options.userId) {
    throw new Error("userId is required to remove current-user Google account state.");
  }

  const [accounts, reports, calendarRows] = await prisma.$transaction([
    prisma.account.deleteMany({
      where: {
        provider: "google",
        userId: options.userId,
      },
    }),
    prisma.weekAnalysisReport.deleteMany({
      where: {
        userId: options.userId,
      },
    }),
    prisma.calendarEvent.deleteMany({
      where: {
        source: "google",
        userId: options.userId,
      },
    }),
  ]);

  return {
    removedAccounts: accounts.count,
    removedReports: reports.count,
    removedCalendarRows: calendarRows.count,
  };
}
