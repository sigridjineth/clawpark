import { beforeEach, describe, expect, it } from "vitest";

import { useClawStore } from "../src/store/useClawStore";
import { createParentPair } from "./clawFixtures";

describe("ClawPark store contracts", () => {
  beforeEach(() => {
    const { parentA, parentB } = createParentPair();
    const current = useClawStore.getState();

    useClawStore.setState({
      ...current,
      claws: [parentA, parentB],
      selectedIds: [parentA.id, parentB.id],
      prediction: null,
      preferredTraitId: null,
      breedResult: null,
      birthPhase: "merge",
      screen: "gallery",
      demoMode: true,
      breedCount: 0,
    });
  });

  it("adds the bred child back into the gallery", () => {
    const beforeCount = useClawStore.getState().claws.length;
    useClawStore.getState().breedSelected();

    const result = useClawStore.getState().breedResult;

    expect(result).not.toBeNull();
    useClawStore.getState().addChildToGallery();

    const afterState = useClawStore.getState();

    expect(afterState.claws).toHaveLength(beforeCount + 1);
    expect(afterState.claws.some((claw) => claw.id === result?.child.id)).toBe(true);
  });
});
