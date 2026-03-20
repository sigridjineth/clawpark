import type { Claw, InheritanceRecord } from './claw';

export type OwnershipState = 'imported' | 'claimed' | 'archived' | 'published';
export type BreedState = 'ready' | 'cooldown' | 'ineligible';
export interface Specimen {
  id: string;
  name: string;
  claw: Claw;
  ownershipState: OwnershipState;
  breedState: BreedState;
  discordUserId?: string | null;
  importRecordId?: string | null;
  parentAId?: string | null;
  parentBId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRecord {
  importId: string;
  sourceKind: string;
  uploadedAt: string;
  includedFiles: string[];
  ignoredFiles: string[];
  warnings: string[];
  fingerprint: string;
  specimenId?: string | null;
  discordUserId?: string | null;
}

export interface ImportPreview {
  importRecord: ImportRecord;
  specimen: Specimen;
}

export interface ImportBatchResult {
  previews: ImportPreview[];
  errors: string[];
}

export type EligibilityResult =
  | {
    eligible: true;
    parentA: Specimen;
    parentB: Specimen;
  }
  | {
    eligible: false;
    reason?: string;
  };

export interface BreedingRunResult {
  runId: string;
  status: 'complete';
  child: Specimen | null;
  inheritanceMap: InheritanceRecord[];
  mutationOccurred: boolean;
}

export interface BreedingRunRecord {
  id: string;
  parentAId: string;
  parentBId: string;
  prompt: string | null;
  conversationJson: string | null;
  predictionJson: string | null;
  resultChildId: string | null;
  status: 'pending' | 'complete' | 'failed' | string;
  createdAt: string;
}

export interface LineageNode {
  specimen: Specimen;
  parentA: LineageNode | null;
  parentB: LineageNode | null;
}

export type LineageTree = LineageNode;

export interface BreedingIntent {
  intentId: string;
  sourceSurface: string;
  sourceMessage: string | null;
  requesterIdentity: string | null;
  targetSpecimenIds: string[];
  status: string;
  suggestedCandidates: unknown[];
  proposalId?: string | null;
  runId?: string | null;
  resultChildId?: string | null;
  blockReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
