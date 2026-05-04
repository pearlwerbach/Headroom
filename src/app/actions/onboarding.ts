"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/forms";
import { SITE_COPY } from "@/lib/copy";
import { scoreQuizAnswers } from "@/lib/onboarding";
import {
  PROFILE_SAVE_TRACE_COOKIE,
  serializeProfileSaveTrace,
} from "@/lib/profile-save-trace";
import { appendProfileWriteTrace } from "@/lib/profile-write-trace";
import { requireUser } from "@/lib/session";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function getCanonicalVariables(profile: ReturnType<typeof scoreQuizAnswers>) {
  return {
    overloadSensitivity: profile.overloadSensitivity,
    fragmentationCost: profile.fragmentationCost,
    transitionCost: profile.transitionCost,
    deepWorkCapacity: profile.deepWorkCapacity,
    ambiguityTolerance: profile.ambiguityTolerance,
    routinePreference: profile.routinePreference,
    socialRecoveryValue: profile.socialRecoveryValue,
    exerciseRecoveryValue: profile.exerciseRecoveryValue,
    quietRecoveryValue: profile.quietRecoveryValue,
    overcommitmentRisk: profile.overcommitmentRisk,
  };
}

function buildWorkProfileWritePayload(profile: ReturnType<typeof scoreQuizAnswers>) {
  return {
    rawAnswers: profile.rawAnswers,
    modelVersion: profile.modelVersion,
    blockNeed: profile.blockNeed,
    fragmentationCost: profile.fragmentationCost,
    switchingCost: profile.switchingCost,
    setupLoad: profile.setupLoad,
    socialSpillover: profile.socialSpillover,
    passiveReset: profile.passiveReset,
    socialReset: profile.socialReset,
    physicalReset: profile.physicalReset,
    overcommitmentRisk: profile.overcommitmentRisk,
    subtypeName: profile.subtypeName,
    subtypeDescription: profile.subtypeDescription,
    shortSummary: profile.shortSummary,
    overloadSensitivity: profile.overloadSensitivity,
    transitionCost: profile.transitionCost,
    deepWorkCapacity: profile.deepWorkCapacity,
    ambiguityTolerance: profile.ambiguityTolerance,
    routinePreference: profile.routinePreference,
    socialRecoveryValue: profile.socialRecoveryValue,
    exerciseRecoveryValue: profile.exerciseRecoveryValue,
    quietRecoveryValue: profile.quietRecoveryValue,
    preferredRecoveryModes: profile.preferredRecoveryModes,
    riskFlags: profile.riskFlags,
    deepWorkPreference: profile.deepWorkPreference,
    fragmentationSensitivity: profile.fragmentationSensitivity,
    socialLoadCost: profile.socialLoadCost,
    ambiguityFriction: profile.ambiguityFriction,
    exerciseRecoveryBenefit: profile.exerciseRecoveryBenefit,
    socialRecoveryBenefit: profile.socialRecoveryBenefit,
    prefersLongBlocks: profile.prefersLongBlocks,
    underestimatesOpenEndedWork: profile.underestimatesOpenEndedWork,
    quizVersion: profile.quizVersion,
  };
}

export async function submitOnboardingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const rawAnswers = formData.get("answers");
  const returnTo = formData.get("returnTo");

  if (typeof rawAnswers !== "string") {
    return {
      status: "error",
      message: SITE_COPY.onboarding.COPY_ONBOARDING_ERROR_INCOMPLETE_SUBMISSION_01,
    };
  }

  const parsedAnswers = onboardingSchema.safeParse({
    answers: JSON.parse(rawAnswers) as Record<string, string>,
  });

  if (!parsedAnswers.success) {
    return {
      status: "error",
      message: SITE_COPY.onboarding.COPY_ONBOARDING_ERROR_INCOMPLETE_ANSWERS_01,
    };
  }

  let profile;

  try {
    profile = scoreQuizAnswers(parsedAnswers.data.answers);
  } catch {
    return {
      status: "error",
      message: SITE_COPY.onboarding.COPY_ONBOARDING_ERROR_SCORE_FAILED_01,
    };
  }

  const dbWritePayload = buildWorkProfileWritePayload(profile);

  const savedProfile = await prisma.workProfile.upsert({
    where: { userId: user.id },
    update: dbWritePayload,
    create: {
      userId: user.id,
      ...dbWritePayload,
    },
  });
  const postWriteRow = await prisma.workProfile.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  if (postWriteRow) {
    await appendProfileWriteTrace({
      callsite: "submitOnboardingAction",
      timestamp: new Date().toISOString(),
      rowId: postWriteRow.id,
      updatedAt: postWriteRow.updatedAt.toISOString(),
      subtypeName: postWriteRow.subtypeName,
      rawAnswers: postWriteRow.rawAnswers,
    });
  }

  await prisma.recommendation.deleteMany({
    where: { userId: user.id },
  });

  if (process.env.PROFILE_MODEL_DEBUG === "true") {
    const cookieStore = await cookies();
    cookieStore.set(
      PROFILE_SAVE_TRACE_COOKIE,
      serializeProfileSaveTrace({
        submittedRawAnswers: profile.rawAnswers as Record<string, string>,
        computedProfileBeforeWrite: {
          rawAnswers: profile.rawAnswers as Record<string, string>,
          modelVersion: profile.modelVersion,
          subtypeName: profile.subtypeName,
          subtypeDescription: profile.subtypeDescription,
          shortSummary: profile.shortSummary,
          canonicalVariables: getCanonicalVariables(profile),
        },
        dbWritePayload,
        canonicalVariables: getCanonicalVariables(profile),
        subtypeName: profile.subtypeName,
        persistedProfile: {
          id: savedProfile.id,
          updatedAt: savedProfile.updatedAt.toISOString(),
        },
        postWriteRow: postWriteRow
          ? {
              id: postWriteRow.id,
              updatedAt: postWriteRow.updatedAt.toISOString(),
              rawAnswers: postWriteRow.rawAnswers,
              modelVersion: postWriteRow.modelVersion,
              subtypeName: postWriteRow.subtypeName,
              subtypeDescription: postWriteRow.subtypeDescription,
              shortSummary: postWriteRow.shortSummary,
              overloadSensitivity: postWriteRow.overloadSensitivity,
              fragmentationCost: postWriteRow.fragmentationCost,
              transitionCost: postWriteRow.transitionCost,
              deepWorkCapacity: postWriteRow.deepWorkCapacity,
              ambiguityTolerance: postWriteRow.ambiguityTolerance,
              routinePreference: postWriteRow.routinePreference,
              socialRecoveryValue: postWriteRow.socialRecoveryValue,
              exerciseRecoveryValue: postWriteRow.exerciseRecoveryValue,
              quietRecoveryValue: postWriteRow.quietRecoveryValue,
              overcommitmentRisk: postWriteRow.overcommitmentRisk,
              preferredRecoveryModes: postWriteRow.preferredRecoveryModes,
              blockNeed: postWriteRow.blockNeed,
              switchingCost: postWriteRow.switchingCost,
              setupLoad: postWriteRow.setupLoad,
              socialSpillover: postWriteRow.socialSpillover,
              passiveReset: postWriteRow.passiveReset,
              socialReset: postWriteRow.socialReset,
              physicalReset: postWriteRow.physicalReset,
              deepWorkPreference: postWriteRow.deepWorkPreference,
              fragmentationSensitivity: postWriteRow.fragmentationSensitivity,
              socialLoadCost: postWriteRow.socialLoadCost,
              ambiguityFriction: postWriteRow.ambiguityFriction,
              exerciseRecoveryBenefit: postWriteRow.exerciseRecoveryBenefit,
              socialRecoveryBenefit: postWriteRow.socialRecoveryBenefit,
            }
          : {},
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/settings");

  if (returnTo === "settings") {
    redirect("/settings?profileSaved=1&trace=1");
  }

  if (returnTo === "onboarding") {
    redirect("/onboarding?complete=1&trace=1");
  }

  redirect("/onboarding/analyzing");
}
