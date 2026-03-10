import { beforeEach, describe, expect, it } from "vitest";
import { createInitialStoreState, useClawStore } from "./useClawStore";

describe("useClawStore", () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
  });

  it("selects claws and computes prediction", () => {
    const state = useClawStore.getState();
    state.selectClaw("claw-001");
    state.selectClaw("claw-002");

    const next = useClawStore.getState();
    expect(next.selectedIds).toEqual(["claw-001", "claw-002"]);
    expect(next.prediction).not.toBeNull();
  });

  it("adds bred child back into the gallery", () => {
    const state = useClawStore.getState();
    state.selectClaw("claw-001");
    state.selectClaw("claw-002");
    useClawStore.getState().breedSelected();

    const bred = useClawStore.getState();
    expect(bred.breedResult?.child).toBeTruthy();

    useClawStore.getState().addChildToGallery();
    const after = useClawStore.getState();

    expect(after.claws[0]?.generation).toBe(1);
    expect(after.screen).toBe("gallery");
  });
});
