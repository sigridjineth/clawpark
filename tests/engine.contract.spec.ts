import { describe, expect, it } from "vitest";

import { breed } from "../src/engine/breed";
import { inheritSkillBadges, inheritSoulTraits, inheritToolBadges } from "../src/engine/inherit";
import { predictBreed } from "../src/engine/predict";
import { createParentPair, createSharedParentPair } from "./clawFixtures";

describe("ClawPark engine contracts", () => {
  it("breed() returns a child with generation increment and lineage map", () => {
    const { parentA, parentB } = createParentPair();

    const result = breed({
      parentA,
      parentB,
      seed: 42,
    });

    expect(result.child.generation).toBe(Math.max(parentA.generation, parentB.generation) + 1);
    expect(result.child.soul.traits).toHaveLength(3);
    expect(result.child.skills.badges).toHaveLength(3);
    expect(result.child.lineage).toMatchObject({
      parentA: parentA.id,
      parentB: parentB.id,
      inheritanceMap: result.inheritanceMap,
    });
  });

  it("strongly inherits duplicate parental traits and skills with origin metadata", () => {
    const { parentA, parentB, sharedTraitId, sharedSkillId } = createSharedParentPair();
    const rng = () => 0.99;

    const soul = inheritSoulTraits(parentA.soul.traits, parentB.soul.traits, undefined, rng);
    const skills = inheritSkillBadges(parentA.skills.badges, parentB.skills.badges, rng);

    expect(soul.selected.map((trait) => trait.id)).toContain(sharedTraitId);
    expect(skills.selected.map((badge) => badge.id)).toContain(sharedSkillId);
    expect(soul.records).toContainEqual(expect.objectContaining({ traitId: sharedTraitId, origin: "both" }));
    expect(skills.records).toContainEqual(expect.objectContaining({ traitId: sharedSkillId, origin: "both" }));
  });

  it("uses the seed deterministically and guarantees a mutation in demo mode", () => {
    const { parentA, parentB } = createParentPair();
    const request = {
      parentA,
      parentB,
      seed: 42,
      demoMode: true,
    } as const;

    const first = breed(request);
    const second = breed(request);

    const projection = (result: ReturnType<typeof breed>) => ({
      mutationOccurred: result.mutationOccurred,
      intro: result.child.intro,
      archetype: result.child.archetype,
      soul: result.child.soul.traits.map((trait) => trait.id),
      skills: result.child.skills.badges.map((badge) => badge.id),
      inheritance: result.inheritanceMap.map((record) => ({
        type: record.type,
        traitId: record.traitId,
        origin: record.origin,
      })),
    });

    expect(projection(first)).toEqual(projection(second));
    expect(first.mutationOccurred).toBe(true);
    expect(first.inheritanceMap).toContainEqual(expect.objectContaining({ origin: "mutation" }));
  });

  it("predictBreed() surfaces probabilities, mutation chance, and a preferred-trait bias", () => {
    const { parentA, parentB } = createParentPair();
    const preferredTraitId = parentA.soul.traits[0].id;

    const baseline = predictBreed(parentA, parentB);
    const preferred = predictBreed(parentA, parentB, preferredTraitId);

    const baselinePreferred = baseline.traitPredictions.find((prediction) => prediction.traitId === preferredTraitId);
    const boostedPreferred = preferred.traitPredictions.find((prediction) => prediction.traitId === preferredTraitId);

    expect(baseline.traitPredictions.length).toBeGreaterThanOrEqual(3);
    expect(baseline.mutationChance).toBeGreaterThanOrEqual(0.05);
    expect(baseline.mutationChance).toBeLessThanOrEqual(0.15);
    expect(baseline.predictedArchetype).toMatch(/^The\s.+/);
    expect(boostedPreferred?.probability ?? 0).toBeGreaterThanOrEqual(baselinePreferred?.probability ?? 0);
  });

  it("uses steering text to bias inheritance toward the requested dimension", () => {
    const traitsA = [
      { id: "analysis", label: "Analysis", description: "Break systems down carefully.", weight: 0.9, color: "#fff", visualSymbol: { shapeModifier: "geometric", description: "" } },
      { id: "systems", label: "Systems", description: "Think in workflows.", weight: 0.8, color: "#fff", visualSymbol: { shapeModifier: "grid", description: "" } },
      { id: "caution", label: "Caution", description: "Verify twice before acting.", weight: 0.3, color: "#fff", visualSymbol: { shapeModifier: "symmetric", description: "" } },
    ];
    const traitsB = [
      { id: "curiosity", label: "Curiosity", description: "Explore the unknown.", weight: 0.8, color: "#fff", visualSymbol: { shapeModifier: "organic", description: "" } },
      { id: "documentation", label: "Documentation", description: "Leave a clear trace.", weight: 0.35, color: "#fff", visualSymbol: { shapeModifier: "crystalline", description: "" } },
      { id: "creativity", label: "Creativity", description: "Invent new paths.", weight: 0.75, color: "#fff", visualSymbol: { shapeModifier: "spiral", description: "" } },
    ];

    const withoutPrompt = inheritSoulTraits(traitsA, traitsB, undefined, () => 0);
    const withPrompt = inheritSoulTraits(traitsA, traitsB, undefined, () => 0, "Please make the child strong at documentation and leaving a trace.");

    expect(withoutPrompt.selected.map((trait) => trait.id)).not.toContain("documentation");
    expect(withPrompt.selected.map((trait) => trait.id)).toContain("documentation");
  });

  it("recomputes tool inheritance from final skills so mutated skill loadouts can surface", () => {
    const loadoutA = [
      { id: "tool-search-probe", label: "Search Probe", icon: "🔎", description: "Search", potency: 0.9, color: "#fff" },
      { id: "tool-workflow-grid", label: "Workflow Grid", icon: "🧭", description: "Workflow", potency: 0.8, color: "#fff" },
      { id: "tool-launch-rail", label: "Launch Rail", icon: "🚀", description: "Launch", potency: 0.7, color: "#fff" },
    ];
    const loadoutB = [
      { id: "tool-sandbox-ward", label: "Sandbox Ward", icon: "🛡️", description: "Sandbox", potency: 0.9, color: "#fff" },
      { id: "tool-search-probe", label: "Search Probe", icon: "🔎", description: "Search", potency: 0.8, color: "#fff" },
      { id: "tool-radar-array", label: "Radar Array", icon: "📡", description: "Radar", potency: 0.7, color: "#fff" },
    ];

    const tools = inheritToolBadges(
      loadoutA,
      loadoutB,
      () => 0,
      "Please keep the child coordinating the team from an orbit board.",
      [{ id: "mutation-swarm", label: "Swarm Sync", icon: "Orbit", dominance: 0.92, color: "#fff" }],
    );

    expect(tools.selected.map((tool) => tool.id)).toContain("tool-orbit-board");
  });
});
