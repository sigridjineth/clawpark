// Full BreedingIntent types for the Discord orchestration system.

export type IntentStatus =
  | 'intent_created'
  | 'candidate_suggested'
  | 'consent_pending'
  | 'eligibility_checked'
  | 'run_started'
  | 'result_ready'
  | 'saved'
  | 'cancelled';

export type ConsentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

export type OwnerRelationship = 'same-owner' | 'same-linked-identity' | 'cross-owner' | 'unknown-owner';

export type SourceSurface = 'discord_bot' | 'discord_claw' | 'web_ui';

export type ParsedAction = 'breed' | 'find_partner' | 'compare' | 'proceed' | 'cancel' | 'greet' | 'persuade' | 'unknown';

export interface RequesterIdentity {
  discordUserId?: string;
  discordHandle?: string;
  sessionUserId?: string;
  anonymous: boolean;
}

export interface CandidateSuggestion {
  specimenId: string;
  name: string;
  compatibilitySummary: string;
  ownerRelationship: OwnerRelationship;
  eligibleForAutoApprove: boolean;
}

export interface BreedingIntent {
  intentId: string;
  sourceSurface: SourceSurface;
  sourceMessage: string;
  requesterIdentity: RequesterIdentity;
  targetSpecimenIds: string[];
  status: IntentStatus;
  suggestedCandidates: CandidateSuggestion[];
  proposalId?: string;
  runId?: string;
  resultChildId?: string;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreedingConsent {
  consentId: string;
  proposalId: string;
  specimenId: string;
  ownerIdentity: string;
  status: ConsentStatus;
  requestedAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface BreedingProposal {
  proposalId: string;
  intentId: string;
  parentAId: string;
  parentBId: string;
  ownerRelationship: OwnerRelationship;
  consentRequired: boolean;
  consentId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'running' | 'complete' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ParsedIntent {
  action: ParsedAction;
  mentionedNames: string[];
  rawMessage: string;
}

export interface OrchestratorDeps {
  resolveSpecimenByName: (name: string) => ResolvedSpecimen | null;
  resolveSpecimenById: (id: string) => ResolvedSpecimen | null;
  listBreedableSpecimens: () => ResolvedSpecimen[];
  listAllSpecimens?: () => ResolvedSpecimen[];
  getSpecimenProfile?: (id: string) => SpecimenProfile | null;
  runBreed: (parentAId: string, parentBId: string, prompt?: string) => Promise<BreedRunResult>;
}

export interface ResolvedSpecimen {
  id: string;
  name: string;
  ownerId: string | null;
  breedable: boolean;
  ownershipState?: string;
  breedState?: string;
}

export interface BreedRunResult {
  runId: string;
  childId: string;
  childName: string;
  lineageSummary: string;
}

export interface SpecimenProfile extends ResolvedSpecimen {
  claw: Claw;
  parentAId?: string | null;
  parentBId?: string | null;
}
import type { Claw } from './claw';
