import { QUIZ_VERSION } from "@/lib/constants";
import { computeCognitiveProfile } from "@/lib/cognitive-profile";
import {
  getRawQuizAnswers,
  quizQuestions,
  scoreExplicitProfile,
  type QuestionId,
} from "@/lib/profile-model";

export { quizQuestions } from "@/lib/profile-model";

export function scoreQuizAnswers(answers: Record<string, string>) {
  const rawAnswers = getRawQuizAnswers(answers);

  if (!rawAnswers) {
    throw new Error("Quiz answers were incomplete or invalid.");
  }

  const explicitProfile = scoreExplicitProfile(rawAnswers);
  const computedProfile = computeCognitiveProfile(rawAnswers);

  return {
    rawAnswers: explicitProfile.rawAnswers,
    modelVersion: explicitProfile.modelVersion,
    blockNeed: explicitProfile.variables.blockNeed,
    fragmentationCost: explicitProfile.variables.fragmentationCost,
    switchingCost: explicitProfile.variables.switchingCost,
    setupLoad: explicitProfile.variables.setupLoad,
    socialSpillover: explicitProfile.variables.socialSpillover,
    passiveReset: explicitProfile.variables.passiveReset,
    socialReset: explicitProfile.variables.socialReset,
    physicalReset: explicitProfile.variables.physicalReset,
    overcommitmentRisk: explicitProfile.variables.overcommitmentRisk,
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
    riskFlags: explicitProfile.riskFlags,
    ...explicitProfile.compatibilityProjection,
    quizVersion: QUIZ_VERSION,
  };
}

export function getQuizQuestionById(questionId: QuestionId) {
  return quizQuestions.find((question) => question.id === questionId);
}
