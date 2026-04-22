import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteWeekAnalysisReport,
  analyzeAndCacheWeek,
  requireUser,
  revalidatePath,
  redirect,
  transaction,
  weekAnalysisDeleteMany,
  calendarEventDeleteMany,
  accountDeleteMany,
  userUpdate,
  removeLocalGoogleAccountState,
  fetchReadableGoogleCalendars,
  resolveIncludedGoogleCalendarIds,
} = vi.hoisted(() => ({
  deleteWeekAnalysisReport: vi.fn(),
  analyzeAndCacheWeek: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  transaction: vi.fn(),
  weekAnalysisDeleteMany: vi.fn(),
  calendarEventDeleteMany: vi.fn(),
  accountDeleteMany: vi.fn(),
  userUpdate: vi.fn(),
  removeLocalGoogleAccountState: vi.fn(),
  fetchReadableGoogleCalendars: vi.fn(),
  resolveIncludedGoogleCalendarIds: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/session", () => ({
  requireUser,
}));

vi.mock("@/lib/week-analysis", () => ({
  analyzeAndCacheWeek,
  deleteWeekAnalysisReport,
}));

vi.mock("@/lib/google-calendar-debug", () => ({
  removeLocalGoogleAccountState,
}));

vi.mock("@/lib/google-calendar", () => ({
  GoogleCalendarAccessError: class GoogleCalendarAccessError extends Error {
    code: "not_connected" | "refresh_failed" | "fetch_failed";
    detail?: string;

    constructor(code: "not_connected" | "refresh_failed" | "fetch_failed", message: string, detail?: string) {
      super(message);
      this.code = code;
      this.detail = detail;
    }
  },
  fetchReadableGoogleCalendars,
  resolveIncludedGoogleCalendarIds,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transaction,
    user: {
      update: userUpdate,
    },
    weekAnalysisReport: {
      deleteMany: weekAnalysisDeleteMany,
    },
    calendarEvent: {
      deleteMany: calendarEventDeleteMany,
    },
    account: {
      deleteMany: accountDeleteMany,
    },
  },
}));

import {
  analyzeWeekAction,
  clearLocalGoogleAccountStateAction,
  disconnectGoogleCalendarAction,
  updateIncludedCalendarsAction,
} from "@/app/actions/week-analysis";
import { GoogleCalendarAccessError } from "@/lib/google-calendar";

describe("disconnectGoogleCalendarAction", () => {
  beforeEach(() => {
    requireUser.mockReset();
    revalidatePath.mockReset();
    transaction.mockReset();
    weekAnalysisDeleteMany.mockReset();
    calendarEventDeleteMany.mockReset();
    accountDeleteMany.mockReset();
    userUpdate.mockReset();
    redirect.mockReset();
    removeLocalGoogleAccountState.mockReset();
    fetchReadableGoogleCalendars.mockReset();
    resolveIncludedGoogleCalendarIds.mockReset();
  });

  it("removes the cached report when Google Calendar is disconnected", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    userUpdate.mockReturnValue({ op: "userUpdate" });
    weekAnalysisDeleteMany.mockReturnValue({ op: "weekAnalysis" });
    calendarEventDeleteMany.mockReturnValue({ op: "calendarEvents" });
    accountDeleteMany.mockReturnValue({ op: "accounts" });
    transaction.mockResolvedValue([]);

    await disconnectGoogleCalendarAction();

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        includedGoogleCalendarIds: [],
      },
    });
    expect(weekAnalysisDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(calendarEventDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        source: "google",
      },
    });
    expect(accountDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        provider: "google",
      },
    });
    expect(transaction).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("can clear the current user's local Google account state", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });

    const formData = new FormData();
    formData.set("mode", "current_user");

    await clearLocalGoogleAccountStateAction(formData);

    expect(removeLocalGoogleAccountState).toHaveBeenCalledWith({
      mode: "user",
      userId: "user-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
    expect(redirect).toHaveBeenCalledWith("/settings?googleStateReset=1");
  });

  it("redirects missing calendar access to a specific dashboard state", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    analyzeAndCacheWeek.mockRejectedValue(
      new GoogleCalendarAccessError(
        "fetch_failed",
        "Missing scope",
        "missing_calendar_access",
      ),
    );

    await analyzeWeekAction();

    expect(deleteWeekAnalysisReport).toHaveBeenCalledWith("user-1");
    expect(redirect).toHaveBeenCalledWith("/dashboard?calendar=missing-access");
  });

  it("redirects provider restrictions to a specific dashboard state", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    analyzeAndCacheWeek.mockRejectedValue(
      new GoogleCalendarAccessError(
        "fetch_failed",
        "Provider restricted",
        "provider_access_restricted",
      ),
    );

    await analyzeWeekAction();

    expect(deleteWeekAnalysisReport).toHaveBeenCalledWith("user-1");
    expect(redirect).toHaveBeenCalledWith("/dashboard?calendar=provider-restricted");
  });

  it("saves selected calendar ids and clears the cached report", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    fetchReadableGoogleCalendars.mockResolvedValue([
      { id: "primary-id", summary: "Primary", primary: true, accessRole: "owner" },
      { id: "team-id", summary: "Team", primary: false, accessRole: "owner" },
    ]);
    resolveIncludedGoogleCalendarIds.mockReturnValue(["primary-id", "team-id"]);
    userUpdate.mockReturnValue({ op: "userUpdate" });
    weekAnalysisDeleteMany.mockReturnValue({ op: "weekAnalysis" });
    transaction.mockResolvedValue([]);

    const formData = new FormData();
    formData.append("calendarId", "primary-id");
    formData.append("calendarId", "team-id");

    await updateIncludedCalendarsAction(formData);

    expect(fetchReadableGoogleCalendars).toHaveBeenCalledWith("user-1");
    expect(resolveIncludedGoogleCalendarIds).toHaveBeenCalledWith(
      ["primary-id", "team-id"],
      expect.any(Array),
    );
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        includedGoogleCalendarIds: ["primary-id", "team-id"],
      },
    });
    expect(weekAnalysisDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(redirect).toHaveBeenCalledWith("/settings?calendarSelectionSaved=1");
  });
});
