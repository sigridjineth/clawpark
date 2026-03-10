import { create } from 'zustand';
import { INITIAL_CLAWS } from '../data/claws';
import { breed } from '../engine/breed';
import { buildBreedingConversation } from '../engine/openclaw';
import { predictBreed } from '../engine/predict';
import type { BreedPrediction, BreedResult, BirthPhase, Claw, ConversationTurn, Screen } from '../types/claw';
import { loadClawsFromStorage, saveClawsToStorage } from '../utils/clawIO';
import { DEMO_PARENT_IDS, DEMO_SEED, resolveBreedSeed } from '../utils/demoMode';

interface ClawStore {
  claws: Claw[];
  selectedIds: string[];
  selectClaw: (id: string) => void;
  deselectClaw: (id: string) => void;
  clearSelection: () => void;

  prediction: BreedPrediction | null;
  preferredTraitId: string | null;
  breedPrompt: string;
  breedingConversation: ConversationTurn[];
  setBreedPrompt: (prompt: string) => void;
  generateParentConversation: () => void;
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

  // Marketplace & Import/Export
  claimMarketplaceClaw: (claw: Claw) => void;
  importClaws: (claws: Claw[]) => void;
  removeClaw: (id: string) => void;

  reset: () => void;
}

export function getSelectedClaws(claws: Claw[], selectedIds: string[]): Claw[] {
  return selectedIds
    .map((id) => claws.find((claw) => claw.id === id))
    .filter((claw): claw is Claw => Boolean(claw));
}

function loadInitialClaws(): Claw[] {
  const saved = loadClawsFromStorage();
  if (saved && saved.length > 0) {
    // Merge: ensure all INITIAL_CLAWS are present (in case new ones were added)
    const savedIds = new Set(saved.map((c) => c.id));
    const missing = INITIAL_CLAWS.filter((c) => !savedIds.has(c.id));
    return [...saved, ...missing];
  }
  return INITIAL_CLAWS;
}

export function createInitialStoreState() {
  return {
    claws: INITIAL_CLAWS,
    selectedIds: [] as string[],
    prediction: null as BreedPrediction | null,
    preferredTraitId: null as string | null,
    breedPrompt: 'Tell me what kind of child should survive this hatch.',
    breedingConversation: [] as ConversationTurn[],
    breedResult: null as BreedResult | null,
    birthPhase: 'merge' as BirthPhase,
    screen: 'gallery' as Screen,
    demoMode: false,
    breedCount: 0,
  };
}

/** Helper to persist claws after mutations */
function persistClaws(claws: Claw[]) {
  saveClawsToStorage(claws);
}

export const useClawStore = create<ClawStore>((set, get) => ({
  ...createInitialStoreState(),
  claws: loadInitialClaws(),

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

  setBreedPrompt: (breedPrompt) => set({ breedPrompt }),

  generateParentConversation: () => {
    const state = get();
    const selectedClaws = getSelectedClaws(state.claws, state.selectedIds);
    if (selectedClaws.length !== 2) {
      return;
    }

    const prediction =
      state.prediction ??
      predictBreed(
        selectedClaws[0],
        selectedClaws[1],
        state.preferredTraitId ?? undefined,
        state.demoMode,
      );
    const conversation = buildBreedingConversation({
      parentA: selectedClaws[0],
      parentB: selectedClaws[1],
      prompt: state.breedPrompt,
      predictedArchetype: prediction.predictedArchetype,
    });
    set({ breedingConversation: conversation, prediction });
  },

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
      breedPrompt: state.breedPrompt,
      breedingConversation: state.breedingConversation,
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
      const nextClaws = exists ? state.claws : [result.child, ...state.claws];
      persistClaws(nextClaws);
      return {
        claws: nextClaws,
        selectedIds: [],
        preferredTraitId: null,
        breedPrompt: 'Tell me what kind of child should survive this hatch.',
        breedingConversation: [],
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
      breedPrompt: 'Tell me what kind of child should survive this hatch.',
      breedingConversation: [],
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

  // Marketplace
  claimMarketplaceClaw: (claw) => {
    set((state) => {
      const exists = state.claws.some((c) => c.id === claw.id);
      if (exists) return state;
      const nextClaws = [claw, ...state.claws];
      persistClaws(nextClaws);
      return { claws: nextClaws };
    });
  },

  // Import
  importClaws: (newClaws) => {
    set((state) => {
      const existingIds = new Set(state.claws.map((c) => c.id));
      const fresh = newClaws.filter((c) => !existingIds.has(c.id));
      if (fresh.length === 0) return state;
      const nextClaws = [...fresh, ...state.claws];
      persistClaws(nextClaws);
      return { claws: nextClaws };
    });
  },

  // Remove
  removeClaw: (id) => {
    set((state) => {
      const nextClaws = state.claws.filter((c) => c.id !== id);
      persistClaws(nextClaws);
      return { claws: nextClaws, selectedIds: state.selectedIds.filter((sid) => sid !== id) };
    });
  },

  reset: () => {
    const initial = createInitialStoreState();
    persistClaws(initial.claws);
    set(initial);
  },
}));
