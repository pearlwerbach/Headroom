import { beforeEach, describe, expect, it, vi } from "vitest";

const { accountFindFirst, accountUpdate } = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
  accountUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findFirst: accountFindFirst,
      update: accountUpdate,
    },
  },
}));

import {
  fetchReadableGoogleCalendars,
  fetchEphemeralPrimaryCalendarEvents,
  fetchEphemeralSelectedCalendarEvents,
  getGoogleAccessToken,
  GoogleCalendarAccessError,
  resolveIncludedGoogleCalendarIds,
} from "@/lib/google-calendar";

describe("google calendar helpers", () => {
  beforeEach(() => {
    accountFindFirst.mockReset();
    accountUpdate.mockReset();
    vi.restoreAllMocks();
  });

  it("refreshes the token when it is about to expire", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "old-token",
      expires_at: Math.floor(Date.now() / 1000) - 5,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "fresh-token",
        expires_in: 3600,
      }),
    } as Response);

    const token = await getGoogleAccessToken("user-1");

    expect(token).toBe("fresh-token");
    expect(accountUpdate).toHaveBeenCalledOnce();
    expect(accountUpdate).toHaveBeenCalledWith({
      where: { id: "account-1" },
      data: expect.objectContaining({
        access_token: "fresh-token",
        refresh_token: "refresh-token",
      }),
    });
  });

  it("returns ephemeral events with transient titles only for classification", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "evt-1",
            summary: "Private meeting",
            description: "Very private",
            attendees: [{ email: "private@example.com" }],
            start: { dateTime: "2026-04-21T16:00:00.000Z" },
            end: { dateTime: "2026-04-21T17:30:00.000Z" },
            status: "confirmed",
          },
        ],
      }),
    } as Response);

    const events = await fetchEphemeralPrimaryCalendarEvents("user-1");

    expect(events).toEqual([
      {
        startTime: new Date("2026-04-21T16:00:00.000Z"),
        endTime: new Date("2026-04-21T17:30:00.000Z"),
        allDay: false,
        durationMinutes: 90,
        rawTitle: "Private meeting",
        rawDescription: "Very private",
        sourceCalendarId: "primary",
        sourceKey: "evt-1",
      },
    ]);
    expect("attendees" in events[0]).toBe(false);
  });

  it("returns readable calendars for local selection UI", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "primary-id",
            summary: "Personal",
            primary: true,
            accessRole: "owner",
          },
          {
            id: "team-id",
            summary: "Team calendar",
            primary: false,
            accessRole: "reader",
          },
        ],
      }),
    } as Response);

    await expect(fetchReadableGoogleCalendars("user-1")).resolves.toEqual([
      {
        id: "primary-id",
        summary: "Personal",
        primary: true,
        accessRole: "owner",
      },
      {
        id: "team-id",
        summary: "Team calendar",
        primary: false,
        accessRole: "reader",
      },
    ]);
  });

  it("merges selected calendars into one transient event list", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "evt-1",
              summary: "Lecture",
              start: { dateTime: "2026-04-21T16:00:00.000Z" },
              end: { dateTime: "2026-04-21T17:00:00.000Z" },
              status: "confirmed",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "evt-2",
              summary: "Gym",
              start: { dateTime: "2026-04-21T18:00:00.000Z" },
              end: { dateTime: "2026-04-21T19:00:00.000Z" },
              status: "confirmed",
            },
          ],
        }),
      } as Response);

    await expect(
      fetchEphemeralSelectedCalendarEvents("user-1", ["primary-id", "team-id"]),
    ).resolves.toHaveLength(2);
  });

  it("throws a reconnect error when no access token is available", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      access_token: null,
      expires_at: null,
      refresh_token: null,
      scope: null,
    });

    await expect(getGoogleAccessToken("user-1")).rejects.toMatchObject({
      code: "refresh_failed",
      detail: "reconnect_needed",
    } satisfies Partial<GoogleCalendarAccessError>);
  });

  it("throws a missing-access error when the saved account lacks calendar scope", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "refresh-token",
      scope: "openid email profile",
    });

    await expect(getGoogleAccessToken("user-1")).rejects.toMatchObject({
      code: "fetch_failed",
      detail: "missing_calendar_access",
    } satisfies Partial<GoogleCalendarAccessError>);
  });

  it("defaults included calendars to primary when no selection is saved", () => {
    expect(
      resolveIncludedGoogleCalendarIds([], [
        { id: "team-id", summary: "Team", primary: false, accessRole: "reader" },
        { id: "primary-id", summary: "Personal", primary: true, accessRole: "owner" },
      ]),
    ).toEqual(["primary-id"]);
  });

  it("uses the stored refresh token when the access token is missing", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: null,
      expires_at: null,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "fresh-token",
        expires_in: 3600,
      }),
    } as Response);

    await expect(getGoogleAccessToken("user-1")).resolves.toBe("fresh-token");
  });

  it("clears stale token state and surfaces reconnect when Google returns invalid_grant", async () => {
    accountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      access_token: "old-token",
      expires_at: Math.floor(Date.now() / 1000) - 5,
      refresh_token: "refresh-token",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      }),
    } as Response);

    await expect(getGoogleAccessToken("user-1")).rejects.toMatchObject({
      code: "refresh_failed",
      detail: "invalid_credentials",
    } satisfies Partial<GoogleCalendarAccessError>);
    expect(accountUpdate).toHaveBeenCalledWith({
      where: { id: "account-1" },
      data: {
        access_token: null,
        expires_at: null,
        refresh_token: null,
      },
    });
  });
});
