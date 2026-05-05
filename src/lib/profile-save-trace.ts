export const PROFILE_SAVE_TRACE_COOKIE = "profile-save-trace";
export const PROFILE_SAVE_USER_COOKIE = "profile-save-user";

export interface ProfileSaveTrace {
  submittedRawAnswers: Record<string, string>;
  computedProfileBeforeWrite: {
    rawAnswers: Record<string, string>;
    modelVersion: string | null | undefined;
    subtypeName: string | null;
    subtypeDescription: string | null | undefined;
    shortSummary: string | null | undefined;
    canonicalVariables: {
      overloadSensitivity: number;
      fragmentationCost: number;
      transitionCost: number;
      deepWorkCapacity: number;
      ambiguityTolerance: number;
      routinePreference: number;
      socialRecoveryValue: number;
      exerciseRecoveryValue: number;
      quietRecoveryValue: number;
      overcommitmentRisk: number;
    };
  };
  dbWritePayload: Record<string, unknown>;
  canonicalVariables: {
    overloadSensitivity: number;
    fragmentationCost: number;
    transitionCost: number;
    deepWorkCapacity: number;
    ambiguityTolerance: number;
    routinePreference: number;
    socialRecoveryValue: number;
    exerciseRecoveryValue: number;
    quietRecoveryValue: number;
    overcommitmentRisk: number;
  };
  subtypeName: string | null;
  persistedProfile: {
    id: string;
    updatedAt: string;
  };
  postWriteRow: Record<string, unknown>;
}

export function serializeProfileSaveTrace(trace: ProfileSaveTrace) {
  return JSON.stringify(trace);
}

export function parseProfileSaveTrace(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as ProfileSaveTrace;
  } catch {
    return null;
  }
}
