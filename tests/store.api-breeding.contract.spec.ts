import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../src/services/clawparkApi';
import type { Claw } from '../src/types/claw';
import type { HomePayload } from '../src/types/home';
import type { Specimen } from '../src/types/specimen';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';
import { createParentPair } from './clawFixtures';

function toSpecimen(claw: Claw, overrides?: Partial<Specimen>): Specimen {
  const now = new Date().toISOString();
  return {
    id: `spec-${claw.id}`,
    name: claw.name,
    claw,
    ownershipState: 'claimed',
    breedState: 'ready',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function seedStoreWithParents(parentA: Claw, parentB: Claw) {
  useClawStore.setState((current) => ({
    ...current,
    claws: [parentA, parentB],
    selectedIds: [parentA.id, parentB.id],
    prediction: null,
    preferredTraitId: null,
    breedingConversation: [],
    breedResult: null,
    screen: 'breedLab',
    birthPhase: 'merge',
    breedingStatusMessage: null,
    breedingPending: false,
    savePending: false,
    activeBreedingRunId: null,
    lastBreedingMode: null,
  }));
}

describe('ClawPark store server-first breeding contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useClawStore.setState(createInitialStoreState());
  });

  it('runs breeding server-first and saves via run save endpoint', async () => {
    const { parentA, parentB } = createParentPair();
    const parentASpecimen = toSpecimen(parentA, { id: 'spec-parent-a' });
    const parentBSpecimen = toSpecimen(parentB, { id: 'spec-parent-b' });
    const childClaw: Claw = {
      ...parentA,
      id: 'child-server-1',
      name: 'Serverling',
      generation: 1,
      lineage: {
        parentA: parentA.id,
        parentB: parentB.id,
        inheritanceMap: [],
      },
    };
    const childSpecimen = toSpecimen(childClaw, { id: 'spec-child-server-1' });

    seedStoreWithParents(parentA, parentB);

    const checkEligibilitySpy = vi.spyOn(api, 'checkEligibility').mockResolvedValue({
      eligible: true,
      parentA: parentASpecimen,
      parentB: parentBSpecimen,
    });
    const createRunSpy = vi.spyOn(api, 'createBreedingRun').mockResolvedValue({
      runId: 'breed-run-1',
      status: 'complete',
      child: childSpecimen,
      inheritanceMap: [],
      mutationOccurred: false,
    });
    const saveRunSpy = vi.spyOn(api, 'saveBreedingRun').mockResolvedValue({
      id: 'breed-run-1',
      parentAId: parentASpecimen.id,
      parentBId: parentBSpecimen.id,
      prompt: null,
      conversationJson: null,
      predictionJson: null,
      resultChildId: childSpecimen.id,
      status: 'complete',
      createdAt: new Date().toISOString(),
      saved: true,
      child: childSpecimen,
    });
    const listSpecimensSpy = vi.spyOn(api, 'listSpecimens').mockResolvedValue([
      parentASpecimen,
      parentBSpecimen,
      childSpecimen,
    ]);
    const getHomeSpy = vi.spyOn(api, 'getHome').mockResolvedValue({
      owned_claw_count: 3,
      breedable_pairs: 1,
      pending_claims: 0,
      unsaved_children: 0,
      what_to_do_next: 'Breed again.',
      suggested_actions: [],
      connected_identity: null,
      onboarding_state: 'none',
    });

    await useClawStore.getState().breedSelected();

    const afterBreed = useClawStore.getState();
    expect(checkEligibilitySpy).toHaveBeenCalledTimes(1);
    expect(createRunSpy).toHaveBeenCalledTimes(1);
    expect(afterBreed.lastBreedingMode).toBe('api');
    expect(afterBreed.activeBreedingRunId).toBe('breed-run-1');
    expect(afterBreed.screen).toBe('birth');

    await useClawStore.getState().persistChildToGallery();

    const afterSave = useClawStore.getState();
    expect(saveRunSpy).toHaveBeenCalledWith('breed-run-1');
    expect(listSpecimensSpy).toHaveBeenCalledTimes(1);
    expect(getHomeSpy).toHaveBeenCalledTimes(1);
    expect(afterSave.screen).toBe('nursery');
    expect(afterSave.claws.some((claw) => claw.id === childClaw.id)).toBe(true);
    expect(afterSave.activeBreedingRunId).toBeNull();
    expect(afterSave.lastBreedingMode).toBeNull();
  });

  it('falls back to local breeding when api is unavailable', async () => {
    const { parentA, parentB } = createParentPair();
    seedStoreWithParents(parentA, parentB);

    vi.spyOn(api, 'checkEligibility').mockRejectedValue(new TypeError('Failed to fetch'));

    await useClawStore.getState().breedSelected();

    const state = useClawStore.getState();
    expect(state.lastBreedingMode).toBe('local_fallback');
    expect(state.activeBreedingRunId).toBeNull();
    expect(state.breedResult).not.toBeNull();
    expect(state.breedingStatusMessage).toContain('API unavailable');
    expect(state.screen).toBe('birth');
  });

  it('refreshes home/specimens after save and persists refreshed server state', async () => {
    const { parentA, parentB } = createParentPair();
    const parentASpecimen = toSpecimen(parentA, { id: 'spec-parent-a-2' });
    const parentBSpecimen = toSpecimen(parentB, { id: 'spec-parent-b-2' });
    const childClaw: Claw = {
      ...parentB,
      id: 'child-server-2',
      name: 'Nursery Sync',
      generation: 1,
      lineage: {
        parentA: parentA.id,
        parentB: parentB.id,
        inheritanceMap: [],
      },
    };
    const childSpecimen = toSpecimen(childClaw, { id: 'spec-child-server-2' });

    const refreshedHome: HomePayload = {
      owned_claw_count: 3,
      breedable_pairs: 1,
      pending_claims: 0,
      unsaved_children: 0,
      what_to_do_next: 'Ready.',
      suggested_actions: [],
      connected_identity: null,
      onboarding_state: 'none',
    };

    seedStoreWithParents(parentA, parentB);

    vi.spyOn(api, 'checkEligibility').mockResolvedValue({
      eligible: true,
      parentA: parentASpecimen,
      parentB: parentBSpecimen,
    });
    vi.spyOn(api, 'createBreedingRun').mockResolvedValue({
      runId: 'breed-run-2',
      status: 'complete',
      child: childSpecimen,
      inheritanceMap: [],
      mutationOccurred: false,
    });
    vi.spyOn(api, 'saveBreedingRun').mockResolvedValue({
      id: 'breed-run-2',
      parentAId: parentASpecimen.id,
      parentBId: parentBSpecimen.id,
      prompt: null,
      conversationJson: null,
      predictionJson: null,
      resultChildId: childSpecimen.id,
      status: 'complete',
      createdAt: new Date().toISOString(),
      saved: true,
      child: childSpecimen,
    });
    vi.spyOn(api, 'listSpecimens').mockResolvedValue([parentASpecimen, parentBSpecimen, childSpecimen]);
    vi.spyOn(api, 'getHome').mockResolvedValue(refreshedHome);

    await useClawStore.getState().breedSelected();
    await useClawStore.getState().persistChildToGallery();

    const state = useClawStore.getState();
    expect(state.specimens.map((specimen) => specimen.id)).toEqual([
      parentASpecimen.id,
      parentBSpecimen.id,
      childSpecimen.id,
    ]);
    expect(state.homePayload).toEqual(refreshedHome);
  });
});
