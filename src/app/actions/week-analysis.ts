"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  fetchReadableGoogleCalendars,
  GoogleCalendarAccessError,
  resolveIncludedGoogleCalendarIds,
} from "@/lib/google-calendar";
import {
  analyzeAndCacheWeek,
  analyzeAndSavePreviousWeekHistory,
  deleteWeekAnalysisReport,
  updateWeekHistoryFeedback,
  type HistoryFeltLoad,
  type HistoryRecoveryQuality,
} from "@/lib/week-analysis";
import { removeLocalGoogleAccountState } from "@/lib/google-calendar-debug";

export async function analyzeWeekAction() {
  const user = await requireUser();

  try {
    await analyzeAndCacheWeek(user.id);
  } catch (error) {
    if (error instanceof GoogleCalendarAccessError) {
      await deleteWeekAnalysisReport(user.id);
      revalidatePath("/dashboard");
      revalidatePath("/settings");
      const calendarState =
        error.detail === "missing_calendar_access"
          ? "missing-access"
          : error.detail === "provider_access_restricted"
            ? "provider-restricted"
            : error.detail === "invalid_credentials"
              ? "invalid-credentials"
              : "reconnect";
      redirect(`/dashboard?calendar=${calendarState}`);
      return;
    }

    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function analyzePreviousWeekHistoryAction() {
  const user = await requireUser();

  try {
    await analyzeAndSavePreviousWeekHistory(user.id);
  } catch (error) {
    if (error instanceof GoogleCalendarAccessError) {
      await deleteWeekAnalysisReport(user.id);
      revalidatePath("/dashboard");
      revalidatePath("/history");
      redirect("/dashboard?calendar=reconnect");
      return;
    }

    throw error;
  }

  revalidatePath("/history");
}

export async function updateWeekHistoryFeedbackAction(input: {
  weekStart: string;
  weekEnd: string;
  feltLoad?: HistoryFeltLoad;
  recoveryQuality?: HistoryRecoveryQuality;
}) {
  const user = await requireUser();

  await updateWeekHistoryFeedback(user.id, {
    weekStart: new Date(input.weekStart),
    weekEnd: new Date(input.weekEnd),
    feedback: {
      ...(input.feltLoad ? { feltLoad: input.feltLoad } : {}),
      ...(input.recoveryQuality ? { recoveryQuality: input.recoveryQuality } : {}),
    },
  });

  revalidatePath("/history");
}

export async function disconnectGoogleCalendarAction() {
  const user = await requireUser();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        includedGoogleCalendarIds: [],
      },
    }),
    prisma.weekAnalysisReport.deleteMany({
      where: { userId: user.id },
    }),
    prisma.calendarEvent.deleteMany({
      where: {
        userId: user.id,
        source: "google",
      },
    }),
    prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider: "google",
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updateIncludedCalendarsAction(formData: FormData) {
  const user = await requireUser();
  const requestedCalendarIds = formData
    .getAll("calendarId")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const availableCalendars = await fetchReadableGoogleCalendars(user.id);
  const selectedCalendarIds = resolveIncludedGoogleCalendarIds(
    requestedCalendarIds,
    availableCalendars,
  );

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        includedGoogleCalendarIds: selectedCalendarIds,
      },
    }),
    prisma.weekAnalysisReport.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?calendarSelectionSaved=1");
}

export async function clearLocalGoogleAccountStateAction(formData: FormData) {
  if (process.env.NODE_ENV === "production" && process.env.PROFILE_MODEL_DEBUG !== "true") {
    throw new Error("Local Google account cleanup is disabled in production.");
  }

  const user = await requireUser();
  const mode = formData.get("mode");

  if (mode === "stale_missing_scope") {
    await removeLocalGoogleAccountState({ mode: "stale_missing_scope" });
  } else if (mode === "current_user") {
    await removeLocalGoogleAccountState({ mode: "user", userId: user.id });
  } else {
    throw new Error("Unknown Google account cleanup mode.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?googleStateReset=1");
}
