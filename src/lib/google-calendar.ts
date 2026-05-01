import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_DAYS } from "@/lib/constants";
import type { EphemeralGoogleEvent } from "@/lib/domain";
import { minutesBetween } from "@/lib/utils";

interface GoogleCalendarEventDate {
  date?: string;
  dateTime?: string;
}

interface GoogleCalendarEvent {
  id: string;
  iCalUID?: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
}

interface GoogleCalendarListItem {
  id: string;
  summary?: string;
  primary?: boolean;
  accessRole?: string;
}

export interface GoogleReadableCalendar {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
}

export class GoogleCalendarAccessError extends Error {
  code: "not_connected" | "refresh_failed" | "fetch_failed";
  detail?:
    | "reconnect_needed"
    | "missing_calendar_access"
    | "provider_access_restricted"
    | "invalid_credentials";

  constructor(
    code: "not_connected" | "refresh_failed" | "fetch_failed",
    message: string,
    detail?:
      | "reconnect_needed"
      | "missing_calendar_access"
      | "provider_access_restricted"
      | "invalid_credentials",
  ) {
    super(message);
    this.code = code;
    this.detail = detail;
    this.name = "GoogleCalendarAccessError";
  }
}

const GOOGLE_CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

function splitScopes(scope?: string | null) {
  return (scope ?? "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isInvalidGrantError(errorBody: unknown) {
  if (!errorBody || typeof errorBody !== "object") {
    return false;
  }

  const errorCode =
    "error" in errorBody && typeof (errorBody as { error?: unknown }).error === "string"
      ? (errorBody as { error: string }).error
      : undefined;

  return errorCode === "invalid_grant";
}

async function markGoogleCalendarReconnectNeeded({
  accountId,
  clearRefreshToken = false,
}: {
  accountId: string;
  clearRefreshToken?: boolean;
}) {
  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: null,
      expires_at: null,
      ...(clearRefreshToken ? { refresh_token: null } : {}),
    },
  });
}

function classifyCalendarFetchFailure(httpStatus: number, errorBody: unknown) {
  const reason = typeof errorBody === "object" && errorBody && "error" in errorBody
    ? (errorBody as {
        error?: {
          errors?: Array<{ reason?: string; message?: string }>;
          message?: string;
        };
      }).error?.errors?.[0]?.reason
    : undefined;
  const message = typeof errorBody === "object" && errorBody && "error" in errorBody
    ? (errorBody as {
        error?: {
          message?: string;
        };
      }).error?.message?.toLowerCase()
    : undefined;

  if (reason === "insufficientPermissions" || message?.includes("insufficient authentication scopes")) {
    return "missing_calendar_access" as const;
  }

  if (
    httpStatus === 403 &&
    (reason === "accessNotConfigured" ||
      reason === "forbidden" ||
      message?.includes("access denied") ||
      message?.includes("admin"))
  ) {
    return "provider_access_restricted" as const;
  }

  if (reason === "authError" || message?.includes("invalid authentication credentials")) {
    return "invalid_credentials" as const;
  }

  return "reconnect_needed" as const;
}

function parseGoogleEventDate(value?: GoogleCalendarEventDate) {
  if (!value) {
    return null;
  }

  if (value.dateTime) {
    return {
      date: new Date(value.dateTime),
      allDay: false,
    };
  }

  if (value.date) {
    return {
      date: new Date(`${value.date}T00:00:00`),
      allDay: true,
    };
  }

  return null;
}

async function refreshGoogleToken(account: {
  id: string;
  userId: string;
  refresh_token: string | null;
}) {
  if (!account.refresh_token) {
    await markGoogleCalendarReconnectNeeded({ accountId: account.id });
    throw new GoogleCalendarAccessError(
      "refresh_failed",
      "Google Calendar access expired. Reconnect Google Calendar.",
      "reconnect_needed",
    );
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

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    console.error("Google token refresh failed", {
      accountId: account.id,
      userId: account.userId,
      hasRefreshToken: Boolean(account.refresh_token),
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });

    const invalidGrant = isInvalidGrantError(errorBody);
    await markGoogleCalendarReconnectNeeded({
      accountId: account.id,
      clearRefreshToken: invalidGrant,
    });

    throw new GoogleCalendarAccessError(
      "refresh_failed",
      "Google Calendar access expired. Reconnect Google Calendar.",
      invalidGrant ? "invalid_credentials" : "reconnect_needed",
    );
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: json.access_token,
      expires_at: Math.floor(Date.now() / 1000 + json.expires_in),
      refresh_token: json.refresh_token ?? account.refresh_token,
    },
  });

  return json.access_token;
}

export async function getGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account?.access_token) {
    if (!account) {
      throw new GoogleCalendarAccessError(
        "not_connected",
        "Google Calendar is not connected yet.",
        "reconnect_needed",
      );
    }

    if (account.refresh_token) {
      return refreshGoogleToken(account);
    }

    await markGoogleCalendarReconnectNeeded({ accountId: account.id });
    throw new GoogleCalendarAccessError(
      "refresh_failed",
      "Google Calendar access expired. Reconnect Google Calendar.",
      "reconnect_needed",
    );
  }

  if (!splitScopes(account.scope).includes(GOOGLE_CALENDAR_READONLY_SCOPE)) {
    throw new GoogleCalendarAccessError(
      "fetch_failed",
      "Google Calendar access is missing from this connection.",
      "missing_calendar_access",
    );
  }

  const expiresSoon = Boolean(account.expires_at && account.expires_at < Date.now() / 1000 + 60);

  if (expiresSoon) {
    if (!account.refresh_token) {
      await markGoogleCalendarReconnectNeeded({ accountId: account.id });
      throw new GoogleCalendarAccessError(
        "refresh_failed",
        "Google Calendar access expired. Reconnect Google Calendar.",
        "reconnect_needed",
      );
    }

    return refreshGoogleToken(account);
  }

  return account.access_token;
}

function buildAnalysisRange() {
  const start = new Date();
  const end = addDays(start, DASHBOARD_DAYS);

  return {
    start,
    end,
  };
}

function normalizeTransientEvents(events: GoogleCalendarEvent[], calendarId: string) {
  return events.flatMap((event) => {
    const start = parseGoogleEventDate(event.start);
    const end = parseGoogleEventDate(event.end);

    if (!start || !end) {
      return [];
    }

    return [
      {
        startTime: start.date,
        endTime: end.date,
        allDay: start.allDay,
        durationMinutes: minutesBetween(start.date, end.date),
        rawTitle: event.summary ?? "",
        rawDescription: event.description ?? null,
        sourceCalendarId: calendarId,
        sourceKey: event.iCalUID ?? event.id,
      } satisfies EphemeralGoogleEvent,
    ];
  });
}

function normalizeReadableCalendars(items: GoogleCalendarListItem[]) {
  return items.flatMap((calendar) => {
    if (!calendar.id) {
      return [];
    }

    return [
      {
        id: calendar.id,
        summary: calendar.summary?.trim() || (calendar.primary ? "Primary calendar" : "Untitled calendar"),
        primary: Boolean(calendar.primary),
        accessRole: calendar.accessRole ?? "reader",
      } satisfies GoogleReadableCalendar,
    ];
  });
}

export async function fetchReadableGoogleCalendars(userId: string) {
  const accessToken = await getGoogleAccessToken(userId);
  const params = new URLSearchParams({
    minAccessRole: "reader",
    showDeleted: "false",
    showHidden: "false",
    maxResults: "250",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/users/me/calendarList?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    console.error("Google Calendar events fetch failed", {
      userId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });

    throw new GoogleCalendarAccessError(
      "fetch_failed",
      "Unable to fetch Google Calendar events.",
      classifyCalendarFetchFailure(response.status, errorBody),
    );
  }

  const json = (await response.json()) as {
    items?: GoogleCalendarListItem[];
  };

  return normalizeReadableCalendars(json.items ?? []);
}

export function resolveIncludedGoogleCalendarIds(
  savedIds: string[] | null | undefined,
  calendars: GoogleReadableCalendar[],
) {
  const validIds = new Set(calendars.map((calendar) => calendar.id));
  const filteredSavedIds = (savedIds ?? []).filter((calendarId) => validIds.has(calendarId));

  if (filteredSavedIds.length > 0) {
    return filteredSavedIds;
  }

  const primaryCalendar = calendars.find((calendar) => calendar.primary);

  if (primaryCalendar) {
    return [primaryCalendar.id];
  }

  return calendars[0] ? [calendars[0].id] : [];
}

function dedupeEphemeralEvents(events: EphemeralGoogleEvent[]) {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = event.sourceKey
      ? `source:${event.sourceKey}`
      : [
          event.startTime.toISOString(),
          event.endTime.toISOString(),
          event.allDay ? "all-day" : "timed",
          event.durationMinutes,
          event.rawTitle.trim().toLowerCase(),
        ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchEphemeralEventsForCalendar(userId: string, calendarId: string) {
  const accessToken = await getGoogleAccessToken(userId);
  const range = buildAnalysisRange();
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString(),
    maxResults: "250",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    console.error("Google Calendar events fetch failed", {
      userId,
      calendarId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });

    throw new GoogleCalendarAccessError(
      "fetch_failed",
      "Unable to fetch Google Calendar events.",
      classifyCalendarFetchFailure(response.status, errorBody),
    );
  }

  const json = (await response.json()) as {
    items?: GoogleCalendarEvent[];
  };

  return normalizeTransientEvents(
    (json.items ?? []).filter((event) => event.status !== "cancelled"),
    calendarId,
  );
}

export async function fetchEphemeralSelectedCalendarEvents(
  userId: string,
  calendarIds: string[],
) {
  const selectedIds = Array.from(new Set(calendarIds));
  const eventGroups = await Promise.all(
    selectedIds.map((calendarId) => fetchEphemeralEventsForCalendar(userId, calendarId)),
  );

  return dedupeEphemeralEvents(eventGroups.flat());
}

export async function fetchEphemeralPrimaryCalendarEvents(userId: string) {
  return fetchEphemeralSelectedCalendarEvents(userId, ["primary"]);
}
