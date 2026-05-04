import { AppShell } from "@/components/app-shell";
import { unstable_noStore as noStore } from "next/cache";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import {
  disconnectGoogleCalendarAction,
  updateIncludedCalendarsAction,
} from "@/app/actions/week-analysis";
import Link from "next/link";
import { SITE_COPY } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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
  const googleLinked = params?.googleLinked === "1";
  const googleStateReset = params?.googleStateReset === "1";
  const calendarStatusParam = typeof params?.calendar === "string" ? params.calendar : null;
  const [account, report, userRecord] = await Promise.all([
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
      ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_CONNECTED_01
      : googleUiStatus === "reconnect_needed"
        ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_RECONNECT_01
        : googleUiStatus === "missing_calendar_access"
          ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_MISSING_ACCESS_01
          : googleUiStatus === "provider_access_restricted"
            ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_PROVIDER_RESTRICTED_01
            : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_NOT_CONNECTED_01;
  const googleStatusCopy =
    googleUiStatus === "connected_ready"
      ? hasFreshReport
        ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_CONNECTED_FRESH_01
        : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_CONNECTED_NEEDS_ANALYSIS_01
      : googleUiStatus === "reconnect_needed"
        ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_RECONNECT_01
        : googleUiStatus === "missing_calendar_access"
          ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_MISSING_ACCESS_01
        : googleUiStatus === "provider_access_restricted"
          ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_PROVIDER_RESTRICTED_01
            : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_COPY_NOT_CONNECTED_01;
  const googleNextStep =
    googleUiStatus === "connected_ready"
      ? hasFreshReport
        ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_FRESH_01
        : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_NEEDS_ANALYSIS_01
      : googleUiStatus === "provider_access_restricted"
        ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_PROVIDER_RESTRICTED_01
        : googleUiStatus === "missing_calendar_access"
          ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_MISSING_ACCESS_01
          : googleUiStatus === "reconnect_needed"
            ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_RECONNECT_01
            : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_NEXTSTEP_NOT_CONNECTED_01;
  const primaryConnectionActionLabel =
    googleUiStatus === "connected_ready" || googleUiStatus === "reconnect_needed"
      ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_RECONNECT_01
      : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_CONNECT_01;
  const primaryButtonClass =
    "inline-flex items-center justify-center rounded-full border border-transparent bg-[#2F3A34] px-6 py-3 text-sm font-medium tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(47,58,52,0.14)] transition duration-150 hover:-translate-y-px hover:bg-[#38463f]";
  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-full border border-[#d6d1c8] bg-white px-5 py-3 text-sm font-medium text-slate-700 transition duration-150 hover:border-[#bcb4a8] hover:bg-[#faf8f5]";
  const tertiaryButtonClass =
    "inline-flex items-center justify-center rounded-full px-2 py-3 text-sm font-medium text-slate-600 transition duration-150 hover:-translate-y-px hover:text-slate-900";

  return (
    <AppShell
      heading="Settings"
      userName={user.name}
      variant="profileReport"
    >
      <main className="mx-auto flex max-w-5xl flex-col gap-10">
        <SectionCard
          title={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_TITLE_01}
          eyebrow={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_EYEBROW_01}
          description={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_DESC_01}
          className="p-8 md:p-9"
        >
          <div className="space-y-6">
            {googleStateReset ? (
              <div className="rounded-[18px] border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm leading-6 text-amber-900">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATE_RESET_01}
              </div>
            ) : null}
            {googleLinked ? (
              <div className="rounded-[18px] border border-emerald-200/70 bg-emerald-50/85 px-4 py-3 text-sm leading-6 text-emerald-900">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_LINKED_01}
              </div>
            ) : null}
            {calendarSelectionSaved ? (
              <div className="rounded-[18px] border border-emerald-200/70 bg-emerald-50/85 px-4 py-3 text-sm leading-6 text-emerald-900">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_CALENDARS_SAVED_01}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill tone={googleStatusTone}>
                {googleStatusLabel}
              </StatusPill>
              <StatusPill>{calendarSummary.label}</StatusPill>
              <StatusPill>{SITE_COPY.settings.COPY_SETTINGS_GOOGLE_STATUS_NEXT7_01}</StatusPill>
            </div>
            <div className="space-y-3">
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_BODY_01}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">{calendarSummary.detail}</p>
            </div>
            <div className="rounded-[20px] border border-[#e4e2db] bg-[#f8f7f3] px-5 py-5">
              <p className="text-sm font-semibold leading-6 text-slate-900">{googleStatusCopy}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{googleNextStep}</p>
            </div>
            {!googleOAuthConfigured ? (
              <p className="max-w-2xl rounded-[18px] border border-amber-200/80 bg-amber-50/85 px-4 py-3 text-sm leading-6 text-amber-900">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_OAUTH_NOT_CONFIGURED_01}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {googleOAuthConfigured ? (
                <Link
                  href="/connect/google"
                  className={primaryButtonClass}
                >
                  {primaryConnectionActionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-medium tracking-[0.02em] text-slate-400"
                >
                  {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_CONNECT_DISABLED_01}
                </button>
              )}
              {account ? (
                <form action={disconnectGoogleCalendarAction}>
                  <button
                    type="submit"
                    className={secondaryButtonClass}
                  >
                    {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_DISCONNECT_01}
                  </button>
                </form>
              ) : null}
              <Link
                href="/dashboard"
                className={tertiaryButtonClass}
              >
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_OPEN_DASHBOARD_01}
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_TITLE_01}
          eyebrow={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_EYEBROW_01}
          description={SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_DESC_01}
          className="p-8 md:p-9"
        >
          {googleUiStatus === "connected_ready" && availableCalendars.length > 0 ? (
            <form action={updateIncludedCalendarsAction} className="space-y-6">
              <div className="space-y-4">
                {availableCalendars.map((calendar) => {
                  const checked = selectedCalendarIds.includes(calendar.id);

                  return (
                    <label
                      key={calendar.id}
                      className="flex cursor-pointer items-center gap-4 rounded-[20px] border border-slate-200/80 bg-slate-50/70 px-5 py-4 transition duration-150 hover:bg-[#f5f4ef]"
                    >
                      <input
                        type="checkbox"
                        name="calendarId"
                        value={calendar.id}
                        defaultChecked={checked}
                        className="h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {calendar.summary}
                        </span>
                        <span className="block text-sm leading-6 text-slate-600">
                          {calendar.primary
                            ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_CALENDAR_PRIMARY_01
                            : calendar.accessRole === "owner"
                              ? SITE_COPY.settings.COPY_SETTINGS_GOOGLE_CALENDAR_OWNED_01
                              : SITE_COPY.settings.COPY_SETTINGS_GOOGLE_CALENDAR_SHARED_01}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_HELPER_01}
              </p>
              <div className="pt-2">
                <button
                  type="submit"
                  className={primaryButtonClass}
                >
                  {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_SAVE_01}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {SITE_COPY.settings.COPY_SETTINGS_GOOGLE_SELECTION_EMPTY_01}
              </p>
            </div>
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
