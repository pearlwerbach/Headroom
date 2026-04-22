"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDashboardPayload, persistRecommendations } from "@/lib/dashboard";
import { feedbackSchema } from "@/lib/forms";
import { requireUser } from "@/lib/session";

export async function regenerateRecommendationsAction() {
  const user = await requireUser();
  const payload = await getDashboardPayload(user.id);

  if (!payload.insights) {
    throw new Error("Complete onboarding before generating recommendations.");
  }

  await persistRecommendations(user.id, payload.insights.drafts);
  revalidatePath("/dashboard");
}

export async function submitRecommendationFeedbackAction(formData: FormData) {
  const user = await requireUser();
  const parsed = feedbackSchema.safeParse({
    recommendationId: formData.get("recommendationId"),
    value: formData.get("value"),
  });

  if (!parsed.success) {
    throw new Error("Unable to save recommendation feedback.");
  }

  await prisma.recommendationFeedback.upsert({
    where: {
      userId_recommendationId: {
        userId: user.id,
        recommendationId: parsed.data.recommendationId,
      },
    },
    update: {
      value: parsed.data.value,
    },
    create: {
      userId: user.id,
      recommendationId: parsed.data.recommendationId,
      value: parsed.data.value,
    },
  });

  await prisma.recommendation.updateMany({
    where: {
      id: parsed.data.recommendationId,
      userId: user.id,
    },
    data: {
      status: parsed.data.value === "useful" ? "useful" : "dismissed",
    },
  });

  revalidatePath("/dashboard");
}
