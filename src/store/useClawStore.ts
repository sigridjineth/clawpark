import { create } from 'zustand';
import { INITIAL_CLAWS } from '../data/claws';
import { breed } from '../engine/breed';
import { buildBreedingConversation } from '../engine/openclaw';
import { predictBreed } from '../engine/predict';
import * as api from '../services/clawparkApi';
import type { HomePayload } from '../types/home';
import type { BreedPrediction, BreedResult, BirthPhase, Claw, ConversationTurn, Screen } from '../types/claw';
import type { BreedingRunResult, ImportPreview, Specimen } from '../types/specimen';
import { DEMO_PARENT_IDS } from '../utils/demoMode';

const DEFAULT_BREED_PROMPT = 'Tell me what kind of child should survive this hatch.';

type BreedingMode = 'api' | 'local_fallback' | null;

interface ClawStore {
  // Server state
  specimens: Specimen[];
  homePayload: HomePayload | null;
  importPreviews: ImportPreview[];

  // Local claw cache (derived from specimens + INITIAL_CLAWS for breed flow)
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
  activeBreedingRunId: string | null;
  breedingPending: boolean;
  savePending: boolean;
  lastBreedingMode: BreedingMode;
  breedingStatusMessage: string | null;
  clearBreedingStatus: () => void;
  setBreedResult: (result: BreedResult | null) => void;
  breedSelected: () => Promise<void>;
  beginBreeding: () => Promise<void>;
  addChildToGallery: () => void;
  persistChildToGallery: () => Promise<void>;
  resetFlow: () => void;

  birthPhase: BirthPhase;
  setBirthPhase: (phase: BirthPhase) => void;

  screen: Screen;
  setScreen: (screen: Screen) => void;

  breedCount: number;
  demoMode: boolean;
  loadDemoPair: () => void;

  // API actions
  fetchHome: () => Promise<void>;
  fetchSpecimens: () => Promise<void>;
  importZipFiles: (files: File[], discordUserId?: string) => Promise<void>;
  claimClaw: (id: string, discordUserId?: string) => Promise<void>;

  // Legacy compat
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

export function createInitialStoreState() {
  return {
    specimens: [] as Specimen[],
    homePayload: null as HomePayload | null,
    importPreviews: [] as ImportPreview[],
    claws: INITIAL_CLAWS,
    selectedIds: [] as string[],
    prediction: null as BreedPrediction | null,
    preferredTraitId: null as string | null,
    breedPrompt: DEFAULT_BREED_PROMPT,
    breedingConversation: [] as ConversationTurn[],
    breedResult: null as BreedResult | null,
    activeBreedingRunId: null as string | null,
    breedingPending: false,
    savePending: false,
    lastBreedingMode: null as BreedingMode,
    breedingStatusMessage: null as string | null,
    birthPhase: 'merge' as BirthPhase,
    screen: 'home' as Screen,
    breedCount: 0,
    demoMode: false,
  };
}

function isApiUnavailableError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  if (
    message.includes('failed to fetch')
    || message.includes('fetch failed')
    || message.includes('networkerror')
    || message.includes('load failed')
  ) {
    return true;
  }

  const statusMatch = error.message.match(/API\s+(\d{3})/i);
  if (!statusMatch) return false;
  const status = Number(statusMatch[1]);
  return status >= 500;
}

function toBreedResultFromApi(run: BreedingRunResult): BreedResult | null {
  if (!run.child) return null;
  return {
    child: run.child.claw,
    inheritanceMap: run.inheritanceMap,
    mutationOccurred: run.mutationOccurred,
    eliminatedSoulIds: [],
    eliminatedSkillIds: [],
    eliminatedToolIds: [],
  };
}

function buildStateAfterPersist(
  state: Pick<
    ClawStore,
    | 'claws'
    | 'specimens'
    | 'demoMode'
    | 'selectedIds'
    | 'breedCount'
  >,
  child: Claw,
  specimen?: Specimen,
) {
  const preserveDemoSelection = state.demoMode;
  const clawExists = state.claws.some((claw) => claw.id === child.id);
  const nextClaws = clawExists ? state.claws : [child, ...state.claws];

  let nextSpecimens = state.specimens;
  if (specimen) {
    nextSpecimens = state.specimens.some((entry) => entry.id === specimen.id)
      ? state.specimens.map((entry) => (entry.id === specimen.id ? specimen : entry))
      : [specimen, ...state.specimens];
  }

  return {
    claws: nextClaws,
    specimens: nextSpecimens,
    selectedIds: preserveDemoSelection ? [...DEMO_PARENT_IDS] : [],
    preferredTraitId: null,
    breedPrompt: DEFAULT_BREED_PROMPT,
    breedingConversation: [],
    prediction: null,
    screen: 'nursery' as Screen,
    birthPhase: 'merge' as BirthPhase,
    breedResult: null as BreedResult | null,
    activeBreedingRunId: null as string | null,
    lastBreedingMode: null as BreedingMode,
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

  setBreedPrompt: (breedPrompt) => set({ breedPrompt }),

  generateParentConversation: () => {
    const state = get();
    const selectedClaws = getSelectedClaws(state.claws, state.selectedIds);
    if (selectedClaws.length !== 2) return;

    const prediction =
      state.prediction ??
      predictBreed(
        selectedClaws[0],
        selectedClaws[1],
        state.preferredTraitId ?? undefined,
        false,
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
        false,
      ),
    });
  },

  clearBreedingStatus: () => set({ breedingStatusMessage: null }),

  setBreedResult: (result) => set({ breedResult: result }),

  breedSelected: async () => {
    const state = get();
    if (state.breedingPending) return;
    const selectedClaws = getSelectedClaws(state.claws, state.selectedIds);
    if (selectedClaws.length !== 2) return;

    set({ breedingPending: true, breedingStatusMessage: null });

    const fallbackToLocalBreeding = () => {
      const latestState = get();
      const latestSelectedClaws = getSelectedClaws(latestState.claws, latestState.selectedIds);
      if (latestSelectedClaws.length !== 2) {
        return;
      }

      const localResult = breed({
        parentA: latestSelectedClaws[0],
        parentB: latestSelectedClaws[1],
        preferredTraitId: latestState.preferredTraitId ?? undefined,
        breedCount: latestState.breedCount,
        breedPrompt: latestState.breedPrompt,
        breedingConversation: latestState.breedingConversation,
        demoMode: latestState.demoMode,
        seed: Date.now() + latestState.breedCount,
      });

      set((current) => ({
        breedResult: localResult,
        screen: 'birth',
        birthPhase: 'merge',
        breedCount: current.breedCount + 1,
        activeBreedingRunId: null,
        lastBreedingMode: 'local_fallback',
        breedingStatusMessage: 'API unavailable, used local simulation.',
      }));
    };

    try {
      const eligibility = await api.checkEligibility(selectedClaws[0].id, selectedClaws[1].id);
      if (!eligibility.eligible) {
        set({
          breedingStatusMessage: eligibility.reason ?? 'Selected pair is not eligible for breeding.',
        });
        return;
      }

      const run = await api.createBreedingRun(
        selectedClaws[0].id,
        selectedClaws[1].id,
        state.breedPrompt,
      );
      const apiResult = toBreedResultFromApi(run);
      if (!apiResult) {
        throw new Error('Breeding run completed without a child payload.');
      }

      set((current) => ({
        breedResult: apiResult,
        screen: 'birth',
        birthPhase: 'merge',
        breedCount: current.breedCount + 1,
        activeBreedingRunId: run.runId,
        lastBreedingMode: 'api',
      }));
    } catch (error) {
      if (isApiUnavailableError(error)) {
        fallbackToLocalBreeding();
        return;
      }
      set({
        breedingStatusMessage: error instanceof Error ? error.message : 'Failed to run breeding.',
      });
    } finally {
      set({ breedingPending: false });
    }
  },

  beginBreeding: async () => {
    await get().breedSelected();
  },

  addChildToGallery: () => {
    const result = get().breedResult;
    if (!result) return;
    const preserveDemoSelection = get().demoMode;
    set((current) => buildStateAfterPersist(current, result.child));

    if (preserveDemoSelection) {
      get().computePrediction();
    }
  },

  persistChildToGallery: async () => {
    const state = get();
    if (state.savePending) return;
    if (!state.breedResult) return;

    const preserveDemoSelection = state.demoMode;
    set({ savePending: true, breedingStatusMessage: null });

    try {
      if (state.lastBreedingMode === 'api' && state.activeBreedingRunId) {
        const saved = await api.saveBreedingRun(state.activeBreedingRunId);
        const childClaw = saved.child?.claw ?? state.breedResult.child;
        if (!childClaw) {
          throw new Error('Breeding save completed without child payload.');
        }

        set((current) => buildStateAfterPersist(current, childClaw, saved.child ?? undefined));
        await Promise.all([get().fetchSpecimens(), get().fetchHome()]);
      } else {
        set((current) => buildStateAfterPersist(current, state.breedResult!.child));
        await Promise.all([get().fetchSpecimens(), get().fetchHome()]);
      }
    } catch (error) {
      set({
        breedingStatusMessage: error instanceof Error ? error.message : 'Failed to save child to nursery.',
      });
      return;
    } finally {
      set({ savePending: false });
    }

    if (preserveDemoSelection) {
      get().computePrediction();
    }
  },

  resetFlow: () => {
    set({
      breedResult: null,
      activeBreedingRunId: null,
      lastBreedingMode: null,
      breedingPending: false,
      savePending: false,
      breedingStatusMessage: null,
      birthPhase: 'merge',
      screen: 'nursery',
      preferredTraitId: null,
      breedPrompt: DEFAULT_BREED_PROMPT,
      breedingConversation: [],
      prediction: null,
    });
  },

  setBirthPhase: (phase) => set({ birthPhase: phase }),
  setScreen: (screen) => set({ screen }),
  loadDemoPair: () => {
    set({
      demoMode: true,
      selectedIds: [...DEMO_PARENT_IDS],
      preferredTraitId: null,
      breedResult: null,
      activeBreedingRunId: null,
      lastBreedingMode: null,
      breedingStatusMessage: null,
      birthPhase: 'merge',
      screen: 'nursery',
    });
    get().computePrediction();
  },


  // API actions
  fetchHome: async () => {
    try {
      const homePayload = await api.getHome();
      set({ homePayload });
    } catch {
      // Server unavailable — silently ignore, UI shows empty state
    }
  },

  fetchSpecimens: async () => {
    try {
      const specimens = await api.listSpecimens();
      const specimenClaws = specimens.map((s) => s.claw);
      set((state) => {
        const localIds = new Set(specimenClaws.map((c) => c.id));
        const initialOnly = state.claws.filter((c) => !localIds.has(c.id));
        return { specimens, claws: [...specimenClaws, ...initialOnly] };
      });
    } catch {
      // Server unavailable — keep local INITIAL_CLAWS
    }
  },

  importZipFiles: async (files, discordUserId) => {
    const result = await api.importOpenClaws(files, discordUserId);
    set((state) => ({
      importPreviews: [...state.importPreviews, ...result.previews],
    }));
    if (result.errors.length > 0) {
      throw new Error(result.errors.join('\n'));
    }
  },

  claimClaw: async (id, discordUserId) => {
    const specimen = await api.claimSpecimen(id, discordUserId);
    set((state) => {
      const exists = state.claws.some((c) => c.id === specimen.claw.id);
      const nextClaws = exists ? state.claws : [specimen.claw, ...state.claws];
      const nextSpecimens = state.specimens.some((s) => s.id === specimen.id)
        ? state.specimens.map((s) => (s.id === specimen.id ? specimen : s))
        : [specimen, ...state.specimens];
      return {
        claws: nextClaws,
        specimens: nextSpecimens,
        importPreviews: state.importPreviews.filter((preview) => preview.specimen.id !== specimen.id),
        screen: 'nursery' as Screen,
      };
    });
  },

  // Legacy compat
  claimMarketplaceClaw: (claw) => {
    set((state) => {
      const exists = state.claws.some((c) => c.id === claw.id);
      if (exists) return state;
      return { claws: [claw, ...state.claws] };
    });
  },

  importClaws: (newClaws) => {
    set((state) => {
      const existingIds = new Set(state.claws.map((c) => c.id));
      const fresh = newClaws.filter((c) => !existingIds.has(c.id));
      if (fresh.length === 0) return state;
      return { claws: [...fresh, ...state.claws] };
    });
  },

  removeClaw: (id) => {
    set((state) => ({
      claws: state.claws.filter((c) => c.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  reset: () => set(createInitialStoreState()),
}));
