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
        "Protected time matters more than how much open time the week appears to have.",
      overviewLine:
        "Your best work depends on protected time, and once a block is broken, depth is harder to recover.",
    });

    expect(SUBTYPE_PRESENTATIONS["Short-Cycle Executor"]).toEqual({
      name: "Short-Cycle Executor",
      description:
        "You can keep work moving in shorter cycles as long as tasks stay concrete and usable.",
      corePattern:
        "Momentum is easier to preserve than waiting for one ideal block later.",
      overviewLine:
        "You can make steady progress in shorter bursts, as long as the work stays clear and easy to re-enter.",
    });
  });

  it("includes an overview line for every current subtype entry", () => {
    expect(
      SUBTYPE_PRESENTATIONS["Context-Sensitive Worker"].overviewLine,
    ).toBe(
      "Your usable time depends as much on context as it does on the clock.",
    );
    expect(
      SUBTYPE_PRESENTATIONS["Reset-Sensitive Scheduler"].overviewLine,
    ).toBe(
      "Starting and switching carry real cost, so the sequence of your week matters as much as the time itself.",
    );
    expect(
      SUBTYPE_PRESENTATIONS["Adaptive Generalist"].overviewLine,
    ).toBe(
      "You can adapt across different kinds of work without heavy setup, which makes your time more consistently usable.",
    );
  });
});
