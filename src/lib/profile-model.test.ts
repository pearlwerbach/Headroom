import { describe, expect, it } from "vitest";
import {
  INITIAL_VARIABLES,
  QUESTION_EFFECTS,
  quizQuestions,
  getPlanningRiskFlags,
  getSubtypeName,
  scoreExplicitProfile,
  type RawQuizAnswers,
} from "@/lib/profile-model";
import { PROFILE_MODEL_VERSION } from "@/lib/constants";

function makeAnswers(overrides: Partial<RawQuizAnswers> = {}): RawQuizAnswers {
  return {
    q1: "B",
    q2: "B",
    q3: "B",
    q4: "B",
    q5: "B",
    q6: "A",
    q7: "B",
    q8: "B",
    q9: "A",
    q10: "A",
    ...overrides,
  };
}

describe("explicit profile model", () => {
  it("uses the full question prompts and answer wording", () => {
    expect(quizQuestions[0]?.prompt).toBe(
      "What kind of work block usually gives you the best output on demanding work?",
    );
    expect(quizQuestions[2]?.prompt).toBe(
      "When you switch between different kinds of work in the same day, how much does it affect your output?",
    );
    expect(quizQuestions[0]?.options.map((option) => option.label)).toEqual([
      "20-40 minute bursts",
      "45-75 minute blocks",
      "90+ minute protected sessions",
      "It depends more on how clearly the work is scoped",
    ]);
    expect(quizQuestions[9]?.options.map((option) => option.label)).toEqual([
      "I plan based on ideal conditions and assume things will go smoothly",
      "My schedule looks reasonable, but ends up feeling more packed than expected",
      "I underestimate how long tasks will take",
      "I end up committing to more than I can actually get through",
    ]);
    expect(quizQuestions[0]?.options[0]?.effects).toEqual({ blockNeed: -2 });
    expect(quizQuestions[9]?.options[3]?.effects).toEqual({ overcommitmentRisk: 2 });
  });

  it("defines the exact question effect maps", () => {
    expect(QUESTION_EFFECTS.q1).toEqual({
      A: { blockNeed: -2 },
      B: {},
      C: { blockNeed: 2 },
      D: { setupLoad: 1 },
    });
    expect(QUESTION_EFFECTS.q2.D).toEqual({
      fragmentationCost: 2,
      setupLoad: 1,
    });
    expect(QUESTION_EFFECTS.q6.B).toEqual({
      socialReset: 2,
      passiveReset: -1,
    });
    expect(QUESTION_EFFECTS.q10.C).toEqual({
      setupLoad: 1,
      overcommitmentRisk: 2,
    });
  });

  it("starts every latent variable at 3 and clamps the final values to the 1..5 range", () => {
    expect(INITIAL_VARIABLES).toEqual({
      blockNeed: 3,
      fragmentationCost: 3,
      switchingCost: 3,
      setupLoad: 3,
      socialSpillover: 3,
      passiveReset: 3,
      socialReset: 3,
      physicalReset: 3,
      overcommitmentRisk: 3,
    });

    const scored = scoreExplicitProfile({
      q1: "C",
      q2: "D",
      q3: "D",
      q4: "D",
      q5: "D",
      q6: "D",
      q7: "D",
      q8: "D",
      q9: "D",
      q10: "D",
    });

    expect(scored.modelVersion).toBe(PROFILE_MODEL_VERSION);
    expect(scored.variables).toEqual({
      blockNeed: 5,
      fragmentationCost: 5,
      switchingCost: 5,
      setupLoad: 5,
      socialSpillover: 5,
      passiveReset: 1,
      socialReset: 2,
      physicalReset: 1,
      overcommitmentRisk: 5,
    });
  });

  it("triggers each planning-risk flag at its exact threshold", () => {
    expect(
      getPlanningRiskFlags({
        blockNeed: 2,
        fragmentationCost: 3,
        switchingCost: 3,
        setupLoad: 3,
        socialSpillover: 3,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("Rescue Block Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 4,
        switchingCost: 3,
        setupLoad: 3,
        socialSpillover: 3,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("False Free Time Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 3,
        switchingCost: 3,
        setupLoad: 3,
        socialSpillover: 4,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("Social Carryover Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 3,
        switchingCost: 3,
        setupLoad: 4,
        socialSpillover: 3,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("Setup Trap Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 3,
        switchingCost: 3,
        setupLoad: 3,
        socialSpillover: 3,
        passiveReset: 2,
        socialReset: 2,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("Weak Recovery Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 3,
        switchingCost: 4,
        setupLoad: 3,
        socialSpillover: 3,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 3,
      }),
    ).toContain("Mode-Switching Risk");

    expect(
      getPlanningRiskFlags({
        blockNeed: 3,
        fragmentationCost: 3,
        switchingCost: 3,
        setupLoad: 3,
        socialSpillover: 3,
        passiveReset: 3,
        socialReset: 3,
        physicalReset: 3,
        overcommitmentRisk: 4,
      }),
    ).toContain("Overcommitment Risk Flag");
  });

  it("uses threshold precedence for subtype selection instead of max subtype score", () => {
    expect(
      getSubtypeName(
        {
          blockNeed: 5,
          fragmentationCost: 5,
          switchingCost: 5,
          setupLoad: 4,
          socialSpillover: 5,
          passiveReset: 1,
          socialReset: 1,
          physicalReset: 1,
          overcommitmentRisk: 4,
        },
        [
          "False Free Time Risk",
          "Social Carryover Risk",
          "Setup Trap Risk",
          "Weak Recovery Risk",
          "Mode-Switching Risk",
          "Overcommitment Risk Flag",
        ],
      ),
    ).toBe("Protected-Block Planner");
  });

  it("covers one fixture for each subtype", () => {
    expect(
      getSubtypeName(
        {
          blockNeed: 2,
          fragmentationCost: 3,
          switchingCost: 3,
          setupLoad: 3,
          socialSpillover: 3,
          passiveReset: 3,
          socialReset: 3,
          physicalReset: 3,
          overcommitmentRisk: 2,
        },
        [],
      ),
    ).toBe("Short-Cycle Executor");

    expect(
      getSubtypeName(
        {
          blockNeed: 5,
          fragmentationCost: 4,
          switchingCost: 4,
          setupLoad: 4,
          socialSpillover: 3,
          passiveReset: 4,
          socialReset: 3,
          physicalReset: 4,
          overcommitmentRisk: 3,
        },
        ["False Free Time Risk", "Mode-Switching Risk"],
      ),
    ).toBe("Protected-Block Planner");

    expect(
      getSubtypeName(
        {
          blockNeed: 3,
          fragmentationCost: 3,
          switchingCost: 4,
          setupLoad: 3,
          socialSpillover: 3,
          passiveReset: 4,
          socialReset: 3,
          physicalReset: 4,
          overcommitmentRisk: 3,
        },
        ["Mode-Switching Risk"],
      ),
    ).toBe("Context-Sensitive Worker");

    expect(
      getSubtypeName(
        {
          blockNeed: 3,
          fragmentationCost: 3,
          switchingCost: 3,
          setupLoad: 3,
          socialSpillover: 4,
          passiveReset: 2,
          socialReset: 2,
          physicalReset: 1,
          overcommitmentRisk: 3,
        },
        ["Social Carryover Risk", "Weak Recovery Risk"],
      ),
    ).toBe("Reset-Sensitive Scheduler");

    expect(
      getSubtypeName(
        {
          blockNeed: 3,
          fragmentationCost: 3,
          switchingCost: 3,
          setupLoad: 4,
          socialSpillover: 3,
          passiveReset: 3,
          socialReset: 3,
          physicalReset: 3,
          overcommitmentRisk: 3,
        },
        [],
      ),
    ).toBe("Adaptive Generalist");
  });

  it("builds a debug-only subtype score breakdown without using it as the authoritative selector", () => {
    const scored = scoreExplicitProfile(makeAnswers({ q1: "C", q2: "D", q3: "D", q5: "D" }));

    expect(scored.subtypeScoreBreakdown).toHaveLength(5);
    expect(scored.subtypeScoreBreakdown[0]?.contributors.length).toBeGreaterThan(0);
    expect(scored.subtypeSupport).toHaveLength(3);
    expect(scored.subtypeName).toBe(
      getSubtypeName(scored.variables, scored.riskFlags),
    );
  });
});
