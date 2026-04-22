import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileOverview } from "@/components/profile-overview";
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

describe("ProfileOverview", () => {
  it("renders only the adaptive signal sentence and not the separate definition line", () => {
    render(<ProfileOverview profile={makeProfile()} />);

    expect(screen.getByText("Broken time quickly reduces how much demanding work stays usable.")).toBeInTheDocument();
    expect(
      screen.queryByText("Short gaps reduce usable work capacity"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Needs uninterrupted time for demanding work"),
    ).not.toBeInTheDocument();
  });

  it("renders the hero with only the fixed overview line and not the old core-pattern line", () => {
    render(<ProfileOverview profile={makeProfile()} />);

    expect(
      screen.getByRole("heading", { name: "Protected-Block Planner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your best work depends on protected time, and once a block is broken, depth is harder to recover.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Protected time matters more than how much open time the week appears to have.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders planning rules as a numbered list", () => {
    render(<ProfileOverview profile={makeProfile()} />);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("3.")).toBeInTheDocument();
  });
});
