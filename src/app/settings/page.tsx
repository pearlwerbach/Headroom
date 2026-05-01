import { AppShell } from "@/components/app-shell";
import { unstable_noStore as noStore } from "next/cache";
import { ProfileOverview } from "@/components/profile-overview";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import {
  disconnectGoogleCalendarAction,
  updateIncludedCalendarsAction,
} from "@/app/actions/week-analysis";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";
import { isGoogleOAuthConfigured } from "@/lib/auth";
import {
  getGoogleCalendarUiStatus,
  getIncludedCalendarsSummary,
} from "@/lib/google-calendar-ui";
import {
  fetchReadableGoogleCalendars,
  resolveIncludedGoogleCalendarIds,
} from "@/lib/google-calendar";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const profileSaved = params?.profileSaved === "1";
  const googleLinked = params?.googleLinked === "1";
  const googleStateReset = params?.googleStateReset === "1";
  const calendarStatusParam = typeof params?.calendar === "string" ? params.calendar : null;
  const [profile, account, report, userRecord] = await Promise.all([
    prisma.workProfile.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
    }),
    prisma.weekAnalysisReport.findUnique({
      where: { userId: user.id },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        includedGoogleCalendarIds: true,
      },
    }),
  ]);
  const googleConnected = Boolean(account?.access_token);
  const hasFreshReport = Boolean(report && report.expiresAt > new Date());
  const googleOAuthConfigured = isGoogleOAuthConfigured();
  const availableCalendars =
    googleOAuthConfigured &&
    account?.access_token &&
    (!account.scope || account.scope.includes("calendar.readonly"))
      ? await fetchReadableGoogleCalendars(user.id).catch(() => [])
      : [];
  const selectedCalendarIds = resolveIncludedGoogleCalendarIds(
    userRecord?.includedGoogleCalendarIds ?? [],
    availableCalendars,
  );
  const calendarSummary = getIncludedCalendarsSummary({
    selectedCalendarIds,
    calendars: availableCalendars,
  });
  const calendarSelectionSaved = params?.calendarSelectionSaved === "1";
  const googleUiStatus = getGoogleCalendarUiStatus({
    googleOAuthConfigured,
    account,
    surfaceError: calendarStatusParam,
  });

  const googleStatusTone =
    googleUiStatus === "connected_ready"
      ? "success"
      : googleUiStatus === "provider_access_restricted"
        ? "warm"
        : "alert";
  const googleStatusLabel =
    googleUiStatus === "connected_ready"
      ? "Connected and ready"
      : googleUiStatus === "reconnect_needed"
        ? "Reconnect needed"
        : googleUiStatus === "missing_calendar_access"
          ? "Calendar access missing"
          : googleUiStatus === "provider_access_restricted"
            ? "Provider access restricted"
            : "Not connected";
  const googleStatusCopy =
    googleUiStatus === "connected_ready"
      ? hasFreshReport
        ? "Google Calendar is connected, and the current week has already been analyzed."
        : "Google Calendar is connected. Your next step is to analyze the current week."
      : googleUiStatus === "reconnect_needed"
        ? "Google Calendar access expired. Reconnect Google Calendar."
        : googleUiStatus === "missing_calendar_access"
          ? "This Google account is linked, but it does not currently include read-only calendar access."
        : googleUiStatus === "provider_access_restricted"
          ? "Google sign-in succeeded, but this account cannot currently expose calendar data to Headroom."
            : "Connect Google Calendar to analyze the next seven days through your profile.";
  const googleNextStep =
    googleUiStatus === "connected_ready"
      ? hasFreshReport
        ? "Re-analyze any time if you want a fresh read."
        : "Analyze your week from the Dashboard."
      : googleUiStatus === "provider_access_restricted"
        ? "Review account access restrictions, then reconnect."
        : googleUiStatus === "missing_calendar_access"
          ? "Reconnect Google Calendar and approve read-only calendar access."
          : googleUiStatus === "reconnect_needed"
            ? "Reconnect Google Calendar, then run a fresh analysis."
            : "Connect Google Calendar to get started.";
  const primaryConnectionActionLabel =
    googleUiStatus === "connected_ready" || googleUiStatus === "reconnect_needed"
      ? "Reconnect Google Calendar"
      : "Connect Google Calendar";

  return (
    <AppShell
      heading="Settings"
      userName={user.name}
      variant="profileReport"
    >
      <main className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Google Calendar"
          eyebrow="Integration"
          description="Read-only access to the Google calendars you include for the next 7 days."
        >
            <div className="space-y-4">
            {googleStateReset ? (
              <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Local Google account state was cleared. Reconnect Google Calendar to create one clean account row.
              </div>
            ) : null}
            {googleLinked ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                Google Calendar connected. Your saved profile is still in place, and your dashboard is ready for week analysis.
              </div>
            ) : null}
            {calendarSelectionSaved ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                Included calendars updated. Re-analyze your week when you want a fresh read from the new set.
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={googleStatusTone}>
                {googleStatusLabel}
              </StatusPill>
              <StatusPill>{calendarSummary.label}</StatusPill>
              <StatusPill>Next 7 days</StatusPill>
              {hasFreshReport ? (
                <StatusPill tone="success">
                  Last analyzed: {formatDateTime(report!.analyzedAt)}
                </StatusPill>
              ) : null}
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Headroom reads only the Google calendars you include here, never writes to them, and
              only analyzes the next seven days. Event names may be read briefly to classify them
              into broad categories, but only the categories and derived insights are stored.
            </p>
            <p className="max-w-xl text-sm leading-6 text-slate-600">{calendarSummary.detail}</p>
            <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/90 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">{googleStatusCopy}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{googleNextStep}</p>
            </div>
            {!googleOAuthConfigured ? (
              <p className="max-w-xl rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Local Google OAuth is not configured yet. Add a real localhost Google client ID and
                secret in <code className="font-mono">.env.local</code>, then restart the dev server.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {googleOAuthConfigured ? (
                <Link
                  href="/connect/google"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {primaryConnectionActionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400"
                >
                  Connect Google Calendar
                </button>
              )}
              {account ? (
                <form action={disconnectGoogleCalendarAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    Disconnect
                  </button>
                </form>
              ) : null}
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Calendars included in analysis"
          eyebrow="Source selection"
          description="Choose which readable Google calendars Headroom should merge into the weekly read."
        >
          {googleUiStatus === "connected_ready" && availableCalendars.length > 0 ? (
            <form action={updateIncludedCalendarsAction} className="space-y-5">
              <div className="space-y-3">
                {availableCalendars.map((calendar) => {
                  const checked = selectedCalendarIds.includes(calendar.id);

                  return (
                    <label
                      key={calendar.id}
                      className="flex items-start gap-3 rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        name="calendarId"
                        value={calendar.id}
                        defaultChecked={checked}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {calendar.summary}
                        </span>
                        <span className="block text-sm leading-6 text-slate-600">
                          {calendar.primary
                            ? "Primary calendar"
                            : calendar.accessRole === "owner"
                              ? "Owned calendar"
                              : "Shared readable calendar"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                If you change the included calendars, Headroom clears the current cached report so the next analysis reflects the new source set.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Save included calendars
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Connect Google Calendar with read-only access before choosing which calendars are included in the weekly analysis.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Work & Recovery Profile"
          eyebrow="Saved profile"
          description="A quick read of how the planner sees your week."
        >
          {profileSaved ? (
            <div className="mb-4 theme-button-soft inline-flex rounded-full px-4 py-2 text-sm font-semibold">
              Profile saved
            </div>
          ) : null}
          {profile ? (
            <ProfileOverview
              profile={profile}
              actions={
                <Link
                  href="/onboarding?edit=1&returnTo=settings"
                  className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                >
                  Retake quiz
                </Link>
              }
            />
          ) : (
            <p className="text-sm text-slate-600">
              Complete the onboarding quiz to create your first profile.
            </p>
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
