import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { CALENDAR_SYNC_DAYS } from "@/lib/constants";
import { inferEventType } from "@/lib/calendar";
import {
  getLegacyCognitiveProfileFallback,
  getPlanningReadyCognitiveProfile,
} from "@/lib/cognitive-profile";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
}

function parseGoogleEventDate(value?: { date?: string; dateTime?: string }) {
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

function normalizeProfile(profile: Awaited<ReturnType<typeof prisma.workProfile.findUnique>>) {
  if (!profile) {
    return null;
  }

  return getPlanningReadyCognitiveProfile(profile) ?? getLegacyCognitiveProfileFallback(profile);
}

async function refreshGoogleToken(accountId: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to refresh Google Calendar access token.");
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: json.access_token,
      expires_at: Math.floor(Date.now() / 1000 + json.expires_in),
      refresh_token: json.refresh_token ?? refreshToken,
    },
  });

  return json.access_token;
}

async function getGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account?.access_token) {
    throw new Error("Google Calendar is not connected yet.");
  }

  const expiresSoon = Boolean(account.expires_at && account.expires_at < Date.now() / 1000 + 60);

  if (expiresSoon && account.refresh_token) {
    return refreshGoogleToken(account.id, account.refresh_token);
  }

  return account.access_token;
}

function buildCalendarRange() {
  const start = new Date();
  const end = addDays(start, CALENDAR_SYNC_DAYS);

  return {
    start,
    end,
  };
}

export async function syncGoogleCalendar(userId: string) {
  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      source: "google_calendar",
      status: "started",
    },
  });

  try {
    const [accessToken, profileRecord] = await Promise.all([
      getGoogleAccessToken(userId),
      prisma.workProfile.findUnique({ where: { userId } }),
    ]);
    const profile = normalizeProfile(profileRecord);
    const range = buildCalendarRange();
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin: range.start.toISOString(),
      timeMax: range.end.toISOString(),
      maxResults: "250",
    });
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Unable to fetch Google Calendar events.");
    }

    const json = (await response.json()) as {
      items?: GoogleCalendarEvent[];
    };
    const events = (json.items ?? []).filter((event) => event.status !== "cancelled");
    const externalIds: string[] = [];

    // TODO: Keep this as the sync seam so Canvas assignments/events can plug in later.
    for (const event of events) {
      const start = parseGoogleEventDate(event.start);
      const end = parseGoogleEventDate(event.end);

      if (!start || !end) {
        continue;
      }

      externalIds.push(event.id);

      await prisma.calendarEvent.upsert({
        where: {
          userId_externalId: {
            userId,
            externalId: event.id,
          },
        },
        update: {
          title: event.summary ?? "Untitled event",
          description: event.description,
          location: event.location,
          startTime: start.date,
          endTime: end.date,
          allDay: start.allDay,
          source: "google",
          inferredType: inferEventType(event.summary ?? "", profile),
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          externalId: event.id,
          title: event.summary ?? "Untitled event",
          description: event.description,
          location: event.location,
          startTime: start.date,
          endTime: end.date,
          allDay: start.allDay,
          source: "google",
          inferredType: inferEventType(event.summary ?? "", profile),
          lastSyncedAt: new Date(),
        },
      });
    }

    await prisma.calendarEvent.deleteMany({
      where: {
        userId,
        source: "google",
        startTime: {
          gte: range.start,
          lte: range.end,
        },
        externalId: {
          notIn: externalIds.length ? externalIds : ["__none__"],
        },
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        itemCount: externalIds.length,
        completedAt: new Date(),
      },
    });

    return {
      syncedCount: externalIds.length,
      windowDays: CALENDAR_SYNC_DAYS,
    };
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown calendar sync error",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function maybeSyncCalendarOnLogin(userId: string) {
  const latestSync = await prisma.syncLog.findFirst({
    where: {
      userId,
      source: "google_calendar",
      status: "completed",
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!latestSync?.completedAt || latestSync.completedAt < today) {
    return syncGoogleCalendar(userId);
  }

  return null;
}
