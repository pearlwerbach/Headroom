import { describe, expect, it } from "vitest";
import { SUBTYPE_PRESENTATIONS } from "@/lib/profile-presentation";

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("profile presentation registry", () => {
  it("keeps subtype descriptions and core patterns concise and structurally consistent", () => {
    const entries = Object.values(SUBTYPE_PRESENTATIONS);
    const baselineKeys = Object.keys(entries[0] ?? {}).sort();

    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual(baselineKeys);
      expect(getWordCount(entry.description)).toBeLessThan(25);
      expect(getWordCount(entry.corePattern)).toBeLessThan(25);
      expect(getWordCount(entry.overviewLine)).toBeLessThan(25);
    }
  });

  it("uses the fixed copy for the current subtype catalog, including overview lines", () => {
    expect(SUBTYPE_PRESENTATIONS["Protected-Block Planner"]).toEqual({
      name: "Protected-Block Planner",
      description:
        "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
      corePattern:
        "Your week works best when deep work is protected before smaller commitments fill the space.",
      overviewLine:
        "When a work block gets interrupted, it can be hard to recover the depth that block was meant to support.",
    });

    expect(SUBTYPE_PRESENTATIONS["Short-Cycle Executor"]).toEqual({
      name: "Short-Cycle Executor",
      description:
        "You keep work moving in shorter cycles when tasks are clear, concrete, and easy to resume.",
      corePattern:
        "Progress comes from maintaining momentum, not waiting for one perfect block.",
      overviewLine:
        "Short windows can stay useful when each task has a clear next action.",
    });
  });

  it("includes an overview line for every current subtype entry", () => {
    expect(
      SUBTYPE_PRESENTATIONS["Context-Sensitive Worker"].overviewLine,
    ).toBe(
      "Your schedule works best when similar modes of work are grouped instead of scattered.",
    );
    expect(
      SUBTYPE_PRESENTATIONS["Reset-Sensitive Scheduler"].overviewLine,
    ).toBe(
      "The sequence of your week matters: heavy blocks can reduce what the next block can support.",
    );
    expect(
      SUBTYPE_PRESENTATIONS["Adaptive Generalist"].overviewLine,
    ).toBe(
      "Your time stays usable across varied weeks, but flexibility can turn into overcommitment if scope expands too far.",
    );
  });
});
