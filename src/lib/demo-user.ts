import { QUIZ_VERSION } from "@/lib/constants";
import { computeCognitiveProfile } from "@/lib/cognitive-profile";
import { appendProfileWriteTrace } from "@/lib/profile-write-trace";
import { scoreExplicitProfile, type RawQuizAnswers } from "@/lib/profile-model";
import { prisma } from "@/lib/prisma";
import { buildSeedEvents, buildSeedTasks } from "@/lib/seed-data";

export const DEMO_USER_EMAIL = "demo@student.example";

const demoAnswers: RawQuizAnswers = {
  q1: "C",
  q2: "D",
  q3: "C",
  q4: "D",
  q5: "B",
  q6: "C",
  q7: "B",
  q8: "A",
  q9: "D",
  q10: "D",
};

export async function ensureDemoUser(now = new Date()) {
  const scoredProfile = scoreExplicitProfile(demoAnswers);
  const computedProfile = computeCognitiveProfile(demoAnswers);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      name: "Demo Student",
    },
  });

  const existingProfile = await prisma.workProfile.findUnique({
    where: { userId: user.id },
  });

  if (!existingProfile) {
    const savedProfile = await prisma.workProfile.create({
      data: {
        userId: user.id,
        rawAnswers: scoredProfile.rawAnswers,
        modelVersion: scoredProfile.modelVersion,
        blockNeed: scoredProfile.variables.blockNeed,
        fragmentationCost: scoredProfile.variables.fragmentationCost,
        switchingCost: scoredProfile.variables.switchingCost,
        setupLoad: scoredProfile.variables.setupLoad,
        socialSpillover: scoredProfile.variables.socialSpillover,
        passiveReset: scoredProfile.variables.passiveReset,
        socialReset: scoredProfile.variables.socialReset,
        physicalReset: scoredProfile.variables.physicalReset,
        overcommitmentRisk: scoredProfile.variables.overcommitmentRisk,
        subtypeName: computedProfile.subtypeName,
        subtypeDescription: computedProfile.subtypeDescription,
        shortSummary: computedProfile.shortSummary,
        overloadSensitivity: computedProfile.profile.overloadSensitivity,
        transitionCost: computedProfile.profile.transitionCost,
        deepWorkCapacity: computedProfile.profile.deepWorkCapacity,
        ambiguityTolerance: computedProfile.profile.ambiguityTolerance,
        routinePreference: computedProfile.profile.routinePreference,
        socialRecoveryValue: computedProfile.profile.socialRecoveryValue,
        exerciseRecoveryValue: computedProfile.profile.exerciseRecoveryValue,
        quietRecoveryValue: computedProfile.profile.quietRecoveryValue,
        preferredRecoveryModes: computedProfile.profile.preferredRecoveryModes,
        riskFlags: scoredProfile.riskFlags,
        ...scoredProfile.compatibilityProjection,
        quizVersion: QUIZ_VERSION,
      },
    });

    await appendProfileWriteTrace({
      callsite: "ensureDemoUser",
      timestamp: new Date().toISOString(),
      rowId: savedProfile.id,
      updatedAt: savedProfile.updatedAt.toISOString(),
      subtypeName: savedProfile.subtypeName,
      rawAnswers: savedProfile.rawAnswers,
    });
  }

  for (const event of buildSeedEvents(now)) {
    await prisma.calendarEvent.upsert({
      where: {
        userId_externalId: {
          userId: user.id,
          externalId: event.externalId,
        },
      },
      update: {
        ...event,
        lastSyncedAt: now,
      },
      create: {
        userId: user.id,
        ...event,
        lastSyncedAt: now,
      },
    });
  }

  for (const task of buildSeedTasks(now)) {
    await prisma.task.upsert({
      where: {
        id: `${user.id}-${task.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        ...task,
      },
      create: {
        id: `${user.id}-${task.title.toLowerCase().replace(/\s+/g, "-")}`,
        userId: user.id,
        ...task,
      },
    });
  }

  return user;
}
