import { describe, expect, it } from "vitest";
import { INITIAL_CLAWS } from "../data/claws";
import { breed } from "./breed";
import { predictBreed } from "./predict";

const [sage, bolt] = INITIAL_CLAWS;

describe("breed engine", () => {
  it("creates a child with lineage and generation increment", () => {
    const result = breed({
      parentA: sage,
      parentB: bolt,
      preferredTraitId: "cautious",
      seed: 42,
      demoMode: true,
    });

    expect(result.child.generation).toBe(1);
    expect(result.child.lineage?.parentA).toBe(sage.id);
    expect(result.child.lineage?.parentB).toBe(bolt.id);
    expect(result.inheritanceMap.length).toBeGreaterThanOrEqual(6);
    expect(result.mutationOccurred).toBe(true);
  });

  it("predicts likely traits and archetype", () => {
    const prediction = predictBreed(sage, bolt, "cautious");

    expect(prediction.traitPredictions.length).toBeGreaterThan(0);
    expect(prediction.traitPredictions[0].label).toBeTruthy();
    expect(prediction.mutationChance).toBeGreaterThan(0);
    expect(prediction.predictedArchetype).toContain("The");
  });
});
