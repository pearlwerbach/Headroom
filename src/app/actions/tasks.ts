"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { taskFormSchema } from "@/lib/forms";
import { requireUser } from "@/lib/session";

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value) {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isNaN(normalized) ? undefined : normalized;
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = taskFormSchema.safeParse({
    title: formData.get("title"),
    dueAt: formData.get("dueAt"),
    estimatedHours: formData.get("estimatedHours"),
    taskType: formData.get("taskType"),
    projectLabel: formData.get("projectLabel"),
    notes: formData.get("notes"),
    ambiguityLevel: optionalNumber(formData.get("ambiguityLevel")),
    emotionalFriction: optionalNumber(formData.get("emotionalFriction")),
    requiresUninterruptedBlock: formData.get("requiresUninterruptedBlock") === "on",
    status: "active",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Unable to save task.");
  }

  await prisma.task.create({
    data: {
      userId: user.id,
      ...parsed.data,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "active");

  await prisma.task.updateMany({
    where: {
      id: taskId,
      userId: user.id,
    },
    data: {
      status: status as "active" | "completed" | "archived",
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
