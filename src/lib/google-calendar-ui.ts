import { format } from "date-fns";
import { SITE_COPY } from "@/lib/copy";
import type { GoogleReadableCalendar } from "@/lib/google-calendar";

const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export type GoogleCalendarUiStatus =
  | "not_connected"
  | "connected_ready"
  | "reconnect_needed"
  | "missing_calendar_access"
  | "provider_access_restricted";

export function splitGoogleScopes(scope?: string | null) {
  return (scope ?? "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasCalendarReadonlyScope(scope?: string | null) {
  return splitGoogleScopes(scope).includes(CALENDAR_READONLY_SCOPE);
}

export function getGoogleCalendarUiStatus({
  googleOAuthConfigured,
  account,
  surfaceError,
}: {
  googleOAuthConfigured: boolean;
  account:
    | {
        access_token?: string | null;
        scope?: string | null;
      }
    | null
    | undefined;
  surfaceError?: string | null;
}): GoogleCalendarUiStatus {
  if (surfaceError === "provider-restricted") {
    return "provider_access_restricted";
  }

  if (surfaceError === "missing-access") {
    return "missing_calendar_access";
  }

  if (!googleOAuthConfigured || !account) {
    return "not_connected";
  }

  if (!hasCalendarReadonlyScope(account.scope)) {
    return "missing_calendar_access";
  }

  if (
    !account.access_token ||
    surfaceError === "reconnect" ||
    surfaceError === "refresh-failed" ||
    surfaceError === "invalid-credentials"
  ) {
    return "reconnect_needed";
  }

  return "connected_ready";
}

export function getGoogleCalendarWeekLink(now = new Date()) {
  return `https://calendar.google.com/calendar/u/0/r/week/${format(now, "yyyy/M/d")}`;
}

export function getIncludedCalendarsSummary({
  selectedCalendarIds,
  calendars,
}: {
  selectedCalendarIds: string[];
  calendars: GoogleReadableCalendar[];
}) {
  const selectedCalendars = calendars.filter((calendar) =>
    selectedCalendarIds.includes(calendar.id),
  );
  const count = selectedCalendars.length || selectedCalendarIds.length;

  if (count === 0) {
    return {
      label: SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_NONE_LABEL_01,
      detail: SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_NONE_DETAIL_01,
    };
  }

  if (count <= 1) {
    const selectedCalendar = selectedCalendars[0];

    return {
      label: SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_ONE_LABEL_01,
      detail: selectedCalendar?.primary
        ? SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_01
        : selectedCalendar?.summary ?? SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_02,
    };
  }

  if (selectedCalendars.length > 0 && selectedCalendars.length <= 2) {
    return {
      label: `${selectedCalendars.length} calendars included`,
      detail: selectedCalendars.map((calendar) => calendar.summary).join(", "),
    };
  }

  return {
    label: `${count} calendars included`,
    detail:
      selectedCalendars.length > 0
        ? selectedCalendars
            .slice(0, 3)
            .map((calendar) => calendar.summary)
            .join(", ")
        : SITE_COPY.settings.COPY_SETTINGS_CALSUMMARY_MULTI_DETAIL_01,
  };
}
