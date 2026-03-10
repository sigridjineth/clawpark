import { create } from 'zustand';
import { INITIAL_CLAWS } from '../data/claws';
import { breed } from '../engine/breed';
import { predictBreed } from '../engine/predict';
import type { BreedPrediction, BreedResult, BirthPhase, Claw, Screen } from '../types/claw';
import { DEMO_PARENT_IDS, DEMO_SEED, resolveBreedSeed } from '../utils/demoMode';

interface ClawStore {
  claws: Claw[];
  selectedIds: string[];
  selectClaw: (id: string) => void;
  deselectClaw: (id: string) => void;
  clearSelection: () => void;

  prediction: BreedPrediction | null;
  preferredTraitId: string | null;
  setPreferredTrait: (traitId: string | null) => void;
  computePrediction: () => void;

  breedResult: BreedResult | null;
  setBreedResult: (result: BreedResult | null) => void;
  breedSelected: () => void;
  beginBreeding: () => void;
  addChildToGallery: () => void;
  persistChildToGallery: () => void;
  resetFlow: () => void;

  birthPhase: BirthPhase;
  setBirthPhase: (phase: BirthPhase) => void;

  screen: Screen;
  setScreen: (screen: Screen) => void;

  demoMode: boolean;
  breedCount: number;
  toggleDemoMode: () => void;
  setDemoMode: (value: boolean) => void;
  loadDemoPair: () => void;

  reset: () => void;
}

export function getSelectedClaws(claws: Claw[], selectedIds: string[]): Claw[] {
  return selectedIds
    .map((id) => claws.find((claw) => claw.id === id))
    .filter((claw): claw is Claw => Boolean(claw));
}

export function createInitialStoreState() {
  return {
    claws: INITIAL_CLAWS,
    selectedIds: [] as string[],
    prediction: null as BreedPrediction | null,
    preferredTraitId: null as string | null,
    breedResult: null as BreedResult | null,
    birthPhase: 'merge' as BirthPhase,
    screen: 'gallery' as Screen,
    demoMode: false,
    breedCount: 0,
  };
}

export const useClawStore = create<ClawStore>((set, get) => ({
  ...createInitialStoreState(),

  selectClaw: (id) => {
    const selected = [...get().selectedIds];

    if (selected.includes(id)) {
      set({ selectedIds: selected.filter((candidate) => candidate !== id) });
      get().computePrediction();
      return;
    }

    const next = selected.length < 2 ? [...selected, id] : [selected[1], id];
    set({ selectedIds: next });
    get().computePrediction();
  },

  deselectClaw: (id) => {
    set({ selectedIds: get().selectedIds.filter((candidate) => candidate !== id) });
    get().computePrediction();
  },

  clearSelection: () => set({ selectedIds: [], prediction: null, preferredTraitId: null }),

  setPreferredTrait: (traitId) => {
    set({ preferredTraitId: traitId });
    get().computePrediction();
  },

  computePrediction: () => {
    const state = get();
    const selectedClaws = getSelectedClaws(state.claws, state.selectedIds);

    if (selectedClaws.length !== 2) {
      set({ prediction: null });
      return;
    }

    set({
      prediction: predictBreed(
        selectedClaws[0],
        selectedClaws[1],
        state.preferredTraitId ?? undefined,
        state.demoMode,
      ),
    });
  },

  setBreedResult: (result) => set({ breedResult: result }),

  breedSelected: () => {
    const state = get();
    const selectedClaws = getSelectedClaws(state.claws, state.selectedIds);
    if (selectedClaws.length !== 2) {
      return;
    }

    const result = breed({
      parentA: selectedClaws[0],
      parentB: selectedClaws[1],
      preferredTraitId: state.preferredTraitId ?? undefined,
      demoMode: state.demoMode,
      breedCount: state.breedCount,
      seed: state.demoMode
        ? DEMO_SEED + state.breedCount
        : resolveBreedSeed(
            selectedClaws[0].id,
            selectedClaws[1].id,
            state.preferredTraitId ?? undefined,
            state.demoMode,
            state.breedCount,
          ),
    });

    set((current) => ({
      breedResult: result,
      screen: 'birth',
      birthPhase: 'merge',
      breedCount: current.breedCount + 1,
    }));
  },

  beginBreeding: () => {
    get().breedSelected();
  },

  addChildToGallery: () => {
    const result = get().breedResult;
    if (!result) {
      return;
    }

    set((state) => {
      const exists = state.claws.some((claw) => claw.id === result.child.id);
      return {
        claws: exists ? state.claws : [result.child, ...state.claws],
        selectedIds: [],
        preferredTraitId: null,
        prediction: null,
        screen: 'gallery' as Screen,
        birthPhase: 'merge' as BirthPhase,
      };
    });
  },

  persistChildToGallery: () => {
    get().addChildToGallery();
  },

  resetFlow: () => {
    set({
      breedResult: null,
      birthPhase: 'merge',
      screen: 'gallery',
      preferredTraitId: null,
      prediction: null,
    });
  },

  setBirthPhase: (phase) => set({ birthPhase: phase }),

  setScreen: (screen) => set({ screen }),

  toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
  setDemoMode: (value) => set({ demoMode: value }),

  loadDemoPair: () => {
    const state = get();
    const demoIds = DEMO_PARENT_IDS.filter((id) => state.claws.some((claw) => claw.id === id));
    if (demoIds.length !== 2) {
      return;
    }

    set({ selectedIds: [...demoIds] });
    get().computePrediction();
  },

  reset: () => set(createInitialStoreState()),
}));
