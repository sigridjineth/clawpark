// Authoritative server contract types for /api/v1/ specimen endpoints.

import type { Claw } from './claw';

export type OwnershipState = 'imported' | 'claimed' | 'archived' | 'published';
export type BreedState = 'ready' | 'cooldown' | 'ineligible';
export type ProvenanceBadge = 'genesis' | 'bred' | 'imported' | 'claimed' | 'purchased';

export interface SpecimenProvenance {
  badge: ProvenanceBadge;
  importedAt?: string;
  importedFrom?: string;
  parentAId?: string;
  parentBId?: string;
  discordUserId?: string;
  discordHandle?: string;
}

export interface Specimen {
  id: string;
  claw: Claw;
  ownershipState: OwnershipState;
  breedState: BreedState;
  provenance: SpecimenProvenance;
  cooldownEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRecord {
  importId: string;
  status: 'pending' | 'parsed' | 'claimed' | 'failed';
  warnings: string[];
  specimenId?: string;
}

export interface ImportPreview {
  importRecord: ImportRecord;
  specimen: Specimen;
}

export interface EligibilityResult {
  eligible: boolean;
  parentA: { id: string; breedState: BreedState; eligible: boolean };
  parentB: { id: string; breedState: BreedState; eligible: boolean };
  reasonCode?: string;
}

export interface BreedingRun {
  runId: string;
  parentAId: string;
  parentBId: string;
  prompt?: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  childSpecimenId?: string;
  createdAt: string;
}

export interface LineageNode {
  specimen: Specimen;
  parentA?: LineageNode;
  parentB?: LineageNode;
}

export interface LineageTree {
  root: LineageNode;
  depth: number;
}

export interface BreedingIntent {
  intentId: string;
  intent: string;
  targetSpecimenIds: string[];
  createdAt: string;
}
