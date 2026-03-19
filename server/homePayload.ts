import type { SpecimenStore } from './specimenStore.ts';

export interface SuggestedAction {
  action: string;
  label: string;
  description: string;
  method: string;
  endpoint: string;
  params?: Record<string, string>;
  priority: number;
}

export interface HomePayload {
  owned_claw_count: number;
  pending_claims: number;
  breedable_pairs: number;
  unsaved_children: number;
  what_to_do_next: string;
  suggested_actions: SuggestedAction[];
  connected_identity: { discordUserId: string; discordHandle?: string } | null;
}

export function buildHomePayload(store: SpecimenStore, discordUserId?: string): HomePayload {
  const counts = store.countByState();
  const actions: SuggestedAction[] = [];

  if (counts.total === 0) {
    actions.push({
      action: 'import_openclaw',
      label: 'Import your first OpenClaw',
      description: 'Upload an OpenClaw workspace ZIP to get started',
      method: 'POST',
      endpoint: '/api/v1/imports/openclaw',
      params: { file: 'multipart/form-data' },
      priority: 1,
    });
  }

  if (counts.imported > 0) {
    actions.push({
      action: 'claim_specimens',
      label: `Claim ${counts.imported} imported specimen${counts.imported > 1 ? 's' : ''}`,
      description: 'Claim imported specimens to add them to your nursery',
      method: 'POST',
      endpoint: '/api/v1/specimens/:id/claim',
      priority: 2,
    });
  }

  if (counts.breedable >= 2) {
    const pairs = Math.floor(counts.breedable * (counts.breedable - 1) / 2);
    actions.push({
      action: 'breed',
      label: `Breed from ${pairs} possible pair${pairs > 1 ? 's' : ''}`,
      description: 'Select two specimens and create a new child',
      method: 'POST',
      endpoint: '/api/v1/breeding/runs',
      priority: 3,
    });
  }

  if (counts.total > 0 && counts.total < 2) {
    actions.push({
      action: 'import_more',
      label: 'Import another OpenClaw to breed',
      description: 'You need at least 2 claimed specimens to breed',
      method: 'POST',
      endpoint: '/api/v1/imports/openclaw',
      params: { file: 'multipart/form-data' },
      priority: 2,
    });
  }

  actions.sort((a, b) => a.priority - b.priority);

  let whatToDoNext = 'Import an OpenClaw workspace to get started.';
  if (counts.imported > 0) whatToDoNext = 'Claim your imported specimens.';
  else if (counts.breedable >= 2) whatToDoNext = 'Select two specimens and breed!';
  else if (counts.claimed === 1) whatToDoNext = 'Import another OpenClaw to have a breeding pair.';

  return {
    owned_claw_count: counts.claimed,
    pending_claims: counts.imported,
    breedable_pairs: counts.breedable >= 2 ? Math.floor(counts.breedable * (counts.breedable - 1) / 2) : 0,
    unsaved_children: 0,
    what_to_do_next: whatToDoNext,
    suggested_actions: actions,
    connected_identity: discordUserId ? { discordUserId } : null,
  };
}
