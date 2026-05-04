import { getSubtypePresentation } from "@/lib/profile-presentation";
import { SITE_COPY } from "@/lib/copy";
import type { SubtypeName } from "@/lib/profile-model";
import { getProfileModel, type ProfileSnapshot } from "@/lib/profile-summary";

export interface ProfileDisplayMetric {
  key: string;
  label: string;
  value: string;
  numericValue: number;
  low: string;
  high: string;
  implication: string;
}

export interface ProfileDisplayData {
  title: string;
  overviewLine: string;
  description: string;
  whatThisMeans: string;
  metrics: ProfileDisplayMetric[];
  keepInMind: string[];
  planningRules: string[];
}

function getNumericValue(value: number | string) {
  if (typeof value === "number") {
    return Math.max(1, Math.min(5, value));
  }

  if (value === "High") {
    return 5;
  }

  if (value === "Medium") {
    return 3;
  }

  return 1;
}

export function getProfileDisplayData(profile: ProfileSnapshot): ProfileDisplayData {
  const model = getProfileModel(profile);
  const title = model.profileName ?? "Cognitive profile";
  const presentation = getSubtypePresentation(title as SubtypeName);

  return {
    title,
    overviewLine: presentation.overviewLine,
    description: model.description,
    whatThisMeans: model.whatThisMeans,
    metrics: model.signals.map((signal) => ({
      key: signal.key,
      label: signal.label,
      value: signal.value,
      numericValue: getNumericValue(signal.value),
      low: SITE_COPY.profile.COPY_PROFILE_REPORT_SIGNAL_LOW_01,
      high: SITE_COPY.profile.COPY_PROFILE_REPORT_SIGNAL_HIGH_01,
      implication: signal.description,
    })),
    keepInMind: model.keepInMind,
    planningRules: model.planningRules,
  };
}
