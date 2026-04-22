"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { eventOverrideSchema } from "@/lib/forms";
import { syncGoogleCalendar } from "@/lib/calendar-sync";
import { requireUser } from "@/lib/session";

export async function refreshCalendarAction() {
  const user = await requireUser();
  await syncGoogleCalendar(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updateEventOverrideAction(formData: FormData) {
  const user = await requireUser();
  const parsed = eventOverrideSchema.safeParse({
    eventId: formData.get("eventId"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    throw new Error("Unable to update event classification.");
  }

  await prisma.calendarEvent.updateMany({
    where: {
      id: parsed.data.eventId,
      userId: user.id,
    },
    data: {
      userOverrideType: parsed.data.type,
    },
  });

  revalidatePath("/dashboard");
}
