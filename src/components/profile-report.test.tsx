import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileReport } from "@/components/profile-report";
import type { ProfileSnapshot } from "@/lib/profile-summary";
import { PROFILE_MODEL_VERSION } from "@/lib/constants";

function makeProfile(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    id: "profile-explicit",
    updatedAt: new Date("2026-04-20T12:00:00Z"),
    rawAnswers: {
      q1: "C",
      q2: "D",
      q3: "D",
      q4: "D",
      q5: "B",
      q6: "C",
      q7: "B",
      q8: "A",
      q9: "D",
      q10: "D",
    },
    modelVersion: PROFILE_MODEL_VERSION,
    blockNeed: 5,
    fragmentationCost: 5,
    switchingCost: 5,
    setupLoad: 5,
    socialSpillover: 2,
    passiveReset: 4,
    socialReset: 3,
    physicalReset: 5,
    overcommitmentRisk: 4,
    subtypeName: "Protected-Block Planner",
    subtypeDescription:
      "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
    shortSummary:
      "Protected time matters more than how much open time the week appears to have.",
    overloadSensitivity: 4,
    transitionCost: 5,
    deepWorkCapacity: 5,
    ambiguityTolerance: 1,
    routinePreference: 5,
    socialRecoveryValue: 3,
    exerciseRecoveryValue: 5,
    quietRecoveryValue: 4,
    preferredRecoveryModes: ["exercise", "quiet", "social"],
    riskFlags: [
      "False Free Time Risk",
      "Setup Trap Risk",
      "Mode-Switching Risk",
      "Overcommitment Risk Flag",
    ],
    deepWorkPreference: 5,
    fragmentationSensitivity: 5,
    socialLoadCost: 2,
    ambiguityFriction: 5,
    exerciseRecoveryBenefit: 5,
    socialRecoveryBenefit: 3,
    prefersLongBlocks: true,
    underestimatesOpenEndedWork: true,
    ...overrides,
  };
}

describe("ProfileReport", () => {
  it("renders the editorial profile sections with the same profile content", () => {
    render(<ProfileReport profile={makeProfile()} />);

    expect(screen.getAllByText("Protected-Block Planner")).toHaveLength(2);
    expect(
      screen.getByText(
        "Your best work depends on protected time, and once a block is broken, depth is harder to recover.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("How you work")).toBeInTheDocument();
    expect(screen.getByText("Cognitive subtype")).toBeInTheDocument();
    expect(screen.getByText("What to keep in mind")).toBeInTheDocument();
    expect(screen.getByText("How to plan around this")).toBeInTheDocument();
  });

  it("never renders developer-facing debug sections", () => {
    render(<ProfileReport profile={makeProfile()} />);

    expect(screen.queryByText("Model debug")).not.toBeInTheDocument();
    expect(screen.queryByText("Latest save trace")).not.toBeInTheDocument();
    expect(screen.queryByText("Visible card runtime trace")).not.toBeInTheDocument();
  });
});
