import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import App from "../src/App";
import { createInitialStoreState, useClawStore } from "../src/store/useClawStore";

describe("ClawPark demo mode contracts", () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, "", "/");
  });

  it("loads the Sage × Bolt showcase pair into the core store flow", () => {
    useClawStore.getState().loadDemoPair();

    const state = useClawStore.getState();

    expect(state.selectedIds).toEqual(["claw-001", "claw-002"]);
    expect(state.prediction).not.toBeNull();
  });

  it("keeps the demo gallery -> breed -> gallery loop working end to end", async () => {
    window.history.replaceState({}, "", "/?demo=true");
    render(createElement(App));

    const enterBreedLab = await screen.findByRole("button", { name: /Enter Lab/i });
    await waitFor(() => expect(enterBreedLab).toBeEnabled());

    fireEvent.click(enterBreedLab);

    const initiateBreeding = await screen.findByRole("button", { name: /Initiate Breeding/i });
    fireEvent.click(initiateBreeding);

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe("birth");
      expect(useClawStore.getState().breedResult?.mutationOccurred).toBe(true);
      expect(useClawStore.getState().breedResult?.child.name).toBe("Ember");
    });

    act(() => {
      useClawStore.getState().setBirthPhase("complete");
    });

    const bredChildId = useClawStore.getState().breedResult?.child.id;

    act(() => {
      useClawStore.getState().addChildToGallery();
    });

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe("nursery");
      expect(useClawStore.getState().selectedIds).toEqual(["claw-001", "claw-002"]);
      expect(useClawStore.getState().claws.some((claw) => claw.id === bredChildId)).toBe(true);
      expect(screen.getByRole("button", { name: /Enter Lab/i })).toBeEnabled();
    });
  });
});
