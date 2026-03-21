// 7-stage breeding orchestration lifecycle.
// intent_created → candidate_suggested → consent_pending → eligibility_checked → run_started → result_ready → saved / cancelled

import { randomUUID } from 'node:crypto';
import type {
  BreedingIntent,
  CandidateSuggestion,
  OrchestratorDeps,
  ParsedIntent,
  RequesterIdentity,
  SourceSurface,
} from '../src/types/breedingIntent.ts';
import { createBreedingConsentStore } from './breedingConsent.ts';

// Shared in-memory stores
const intentStore = new Map<string, BreedingIntent>();
export const consentStore = createBreedingConsentStore();

// Multi-turn: discordUserId → intentId
const userLastIntent = new Map<string, string>();

// --- Intent CRUD ---

export function getIntentById(id: string): BreedingIntent | null {
  return intentStore.get(id) ?? null;
}

export function getUserLastIntent(discordUserId: string): BreedingIntent | null {
  const id = userLastIntent.get(discordUserId);
  return id ? (intentStore.get(id) ?? null) : null;
}

export function setUserLastIntent(discordUserId: string, intentId: string): void {
  userLastIntent.set(discordUserId, intentId);
}

function touchIntent(intent: BreedingIntent): BreedingIntent {
  intent.updatedAt = new Date().toISOString();
  intentStore.set(intent.intentId, intent);
  return intent;
}

// --- Stage 1: Create intent ---

export function createIntent(params: {
  sourceSurface: SourceSurface;
  sourceMessage: string;
  requesterIdentity: RequesterIdentity;
  parsedIntent: ParsedIntent;
  targetSpecimenIds?: string[];
}): BreedingIntent {
  const now = new Date().toISOString();
  const intent: BreedingIntent = {
    intentId: randomUUID(),
    sourceSurface: params.sourceSurface,
    sourceMessage: params.sourceMessage,
    requesterIdentity: params.requesterIdentity,
    targetSpecimenIds: params.targetSpecimenIds ?? [],
    status: 'intent_created',
    suggestedCandidates: [],
    awaitingSteering: false,
    createdAt: now,
    updatedAt: now,
  };
  intentStore.set(intent.intentId, intent);
  return intent;
}

// --- Stage 2: Suggest candidates ---

export async function suggestCandidates(
  intentId: string,
  deps: OrchestratorDeps,
): Promise<BreedingIntent> {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);

  const breedable = deps.listBreedableSpecimens();
  if (intent.targetSpecimenIds.length === 0) {
    // No target — suggest top 3 breedable specimens
    intent.suggestedCandidates = breedable.slice(0, 3).map(
      (s): CandidateSuggestion => ({
        specimenId: s.id,
        name: s.name,
        compatibilitySummary: 'Available for breeding',
        ownerRelationship: 'same-owner',
        eligibleForAutoApprove: true,
      }),
    );
  } else if (intent.targetSpecimenIds.length === 1) {
    // One target — find compatible partners
    const parentA = deps.resolveSpecimenById(intent.targetSpecimenIds[0]);
    if (!parentA) {
      intent.blockReason = `Specimen "${intent.targetSpecimenIds[0]}" not found`;
      intent.status = 'cancelled';
      return touchIntent(intent);
    }

    intent.suggestedCandidates = breedable
      .filter((s) => s.id !== parentA.id)
      .slice(0, 3)
      .map((s): CandidateSuggestion => ({
        specimenId: s.id,
        name: s.name,
        compatibilitySummary: 'Available for breeding',
        ownerRelationship: 'same-owner',
        eligibleForAutoApprove: true,
      }));
  } else {
    // Two targets — show compatibility between them
    const parentA = deps.resolveSpecimenById(intent.targetSpecimenIds[0]);
    const parentB = deps.resolveSpecimenById(intent.targetSpecimenIds[1]);
    if (!parentA || !parentB) {
      intent.blockReason = 'One or both specimens not found';
      intent.status = 'cancelled';
      return touchIntent(intent);
    }
    intent.suggestedCandidates = [
      {
        specimenId: parentB.id,
        name: parentB.name,
        compatibilitySummary: 'Available for breeding',
        ownerRelationship: 'same-owner',
        eligibleForAutoApprove: true,
      },
    ];
  }

  intent.status = 'candidate_suggested';
  return touchIntent(intent);
}

// --- Stages 3–4: Eligibility + consent check ---

export async function checkEligibilityAndConsent(
  intentId: string,
  deps: OrchestratorDeps,
): Promise<{ intent: BreedingIntent; ready: boolean; blocked?: string }> {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);

  if (intent.targetSpecimenIds.length < 2) {
    return { intent, ready: false, blocked: 'Two specimens must be selected for breeding' };
  }

  const parentA = deps.resolveSpecimenById(intent.targetSpecimenIds[0]);
  const parentB = deps.resolveSpecimenById(intent.targetSpecimenIds[1]);

  if (!parentA) {
    intent.blockReason = `Specimen "${intent.targetSpecimenIds[0]}" not found`;
    intent.status = 'cancelled';
    touchIntent(intent);
    return { intent, ready: false, blocked: intent.blockReason };
  }
  if (!parentB) {
    intent.blockReason = `Specimen "${intent.targetSpecimenIds[1]}" not found`;
    intent.status = 'cancelled';
    touchIntent(intent);
    return { intent, ready: false, blocked: intent.blockReason };
  }
  if (!parentA.breedable) {
    intent.blockReason = `${parentA.name} is not eligible for breeding`;
    intent.status = 'cancelled';
    touchIntent(intent);
    return { intent, ready: false, blocked: intent.blockReason };
  }
  if (!parentB.breedable) {
    intent.blockReason = `${parentB.name} is not eligible for breeding`;
    intent.status = 'cancelled';
    touchIntent(intent);
    return { intent, ready: false, blocked: intent.blockReason };
  }

  const proposal = consentStore.createProposal({
    intentId,
    parentAId: parentA.id,
    parentBId: parentB.id,
    parentAOwnerId: parentA.ownerId,
    parentBOwnerId: parentB.ownerId,
    requesterDiscordUserId: intent.requesterIdentity.discordUserId,
  });
  intent.proposalId = proposal.proposalId;

  intent.status = 'eligibility_checked';
  touchIntent(intent);
  return { intent, ready: true };
}

// --- Stages 5–6: Execute breed ---

export async function executeBreed(
  intentId: string,
  deps: OrchestratorDeps,
  prompt?: string,
): Promise<{ intent: BreedingIntent; childId?: string; childName?: string; lineageSummary?: string }> {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);

  if (intent.status !== 'eligibility_checked') {
    throw new Error(`Cannot execute breed from state "${intent.status}"`);
  }

  if (intent.proposalId) {
    const proposal = consentStore.getProposal(intent.proposalId);
    if (!proposal || proposal.status !== 'approved') {
      intent.status = 'consent_pending';
      touchIntent(intent);
      throw new Error('Proposal not yet approved');
    }
  }

  intent.status = 'run_started';
  touchIntent(intent);
  if (intent.proposalId) consentStore.markRunning(intent.proposalId);

  try {
    const result = await deps.runBreed(
      intent.targetSpecimenIds[0],
      intent.targetSpecimenIds[1],
      prompt,
    );

    intent.runId = result.runId;
    intent.resultChildId = result.childId;
    intent.status = 'result_ready';
    touchIntent(intent);
    if (intent.proposalId) consentStore.markComplete(intent.proposalId);

    return { intent, childId: result.childId, childName: result.childName, lineageSummary: result.lineageSummary };
  } catch (error) {
    intent.status = 'cancelled';
    intent.blockReason = error instanceof Error ? error.message : 'Breed engine error';
    touchIntent(intent);
    if (intent.proposalId) consentStore.cancelProposal(intent.proposalId);
    throw error;
  }
}

// --- Stage 7: Save result ---

export function markIntentSaved(intentId: string): BreedingIntent {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);
  if (intent.status !== 'result_ready') throw new Error('Nothing to save yet');
  intent.status = 'saved';
  return touchIntent(intent);
}

export function cancelIntent(intentId: string, reason?: string): BreedingIntent | null {
  const intent = intentStore.get(intentId);
  if (!intent) return null;
  intent.status = 'cancelled';
  intent.blockReason = reason ?? 'Cancelled by user';
  if (intent.proposalId) consentStore.cancelProposal(intent.proposalId);
  return touchIntent(intent);
}

export function setIntentSteeringQuestion(intentId: string, question: string): BreedingIntent {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);
  intent.awaitingSteering = true;
  intent.steeringQuestion = question;
  return touchIntent(intent);
}

export function setIntentSteeringResponse(intentId: string, response: string): BreedingIntent {
  const intent = intentStore.get(intentId);
  if (!intent) throw new Error(`Intent not found: ${intentId}`);
  intent.awaitingSteering = false;
  intent.steeringResponse = response;
  return touchIntent(intent);
}
