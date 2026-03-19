// Breeding consent model.
// same-owner / anonymous → auto-approve
// cross-owner / unknown-owner → pending with 24h timeout

import { randomUUID } from 'node:crypto';
import type { BreedingConsent, BreedingProposal, ConsentStatus, OwnerRelationship } from '../src/types/breedingIntent.ts';

const CONSENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function determineOwnerRelationship(
  parentAOwnerId: string | null,
  parentBOwnerId: string | null,
  requesterDiscordUserId?: string,
): OwnerRelationship {
  if (!parentAOwnerId || !parentBOwnerId) return 'unknown-owner';
  if (parentAOwnerId === parentBOwnerId) return 'same-owner';
  if (
    requesterDiscordUserId &&
    (parentAOwnerId === requesterDiscordUserId || parentBOwnerId === requesterDiscordUserId)
  ) {
    return 'same-linked-identity';
  }
  return 'cross-owner';
}

export function isAutoApprove(relationship: OwnerRelationship): boolean {
  return relationship === 'same-owner' || relationship === 'same-linked-identity';
}

export function createBreedingConsentStore() {
  const consents = new Map<string, BreedingConsent>();
  const proposals = new Map<string, BreedingProposal>();

  function expireStale() {
    const now = new Date().toISOString();
    for (const consent of consents.values()) {
      if (consent.status === 'pending' && consent.expiresAt < now) {
        consent.status = 'expired';
        const proposal = proposals.get(consent.proposalId);
        if (proposal && proposal.status === 'pending') {
          proposal.status = 'expired';
          proposal.updatedAt = now;
        }
      }
    }
  }

  return {
    createProposal(params: {
      intentId: string;
      parentAId: string;
      parentBId: string;
      parentAOwnerId: string | null;
      parentBOwnerId: string | null;
      requesterDiscordUserId?: string;
    }): BreedingProposal {
      expireStale();

      const relationship = determineOwnerRelationship(
        params.parentAOwnerId,
        params.parentBOwnerId,
        params.requesterDiscordUserId,
      );
      const consentRequired = !isAutoApprove(relationship);
      const now = new Date().toISOString();
      const proposalId = randomUUID();

      const proposal: BreedingProposal = {
        proposalId,
        intentId: params.intentId,
        parentAId: params.parentAId,
        parentBId: params.parentBId,
        ownerRelationship: relationship,
        consentRequired,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      if (consentRequired) {
        const consentId = randomUUID();
        const expiresAt = new Date(Date.now() + CONSENT_TIMEOUT_MS).toISOString();
        const ownerIdentity = params.parentBOwnerId ?? 'unknown';

        const consent: BreedingConsent = {
          consentId,
          proposalId,
          specimenId: params.parentBId,
          ownerIdentity,
          status: 'pending',
          requestedAt: now,
          expiresAt,
        };
        consents.set(consentId, consent);
        proposal.consentId = consentId;
      } else {
        proposal.status = 'approved';
      }

      proposals.set(proposalId, proposal);
      return proposal;
    },

    getProposal(proposalId: string): BreedingProposal | null {
      expireStale();
      return proposals.get(proposalId) ?? null;
    },

    respondToConsent(consentId: string, response: 'approved' | 'rejected'): BreedingConsent | null {
      expireStale();
      const consent = consents.get(consentId);
      if (!consent || consent.status !== 'pending') return null;

      const now = new Date().toISOString();
      consent.status = response;
      consent.respondedAt = now;

      const proposal = proposals.get(consent.proposalId);
      if (proposal) {
        proposal.status = response === 'approved' ? 'approved' : 'rejected';
        proposal.updatedAt = now;
      }

      return consent;
    },

    approveProposal(proposalId: string): BreedingProposal | null {
      const proposal = proposals.get(proposalId);
      if (!proposal) return null;
      const now = new Date().toISOString();
      proposal.status = 'approved';
      proposal.updatedAt = now;
      if (proposal.consentId) {
        const consent = consents.get(proposal.consentId);
        if (consent) {
          consent.status = 'approved' as ConsentStatus;
          consent.respondedAt = now;
        }
      }
      return proposal;
    },

    cancelProposal(proposalId: string): BreedingProposal | null {
      const proposal = proposals.get(proposalId);
      if (!proposal) return null;
      proposal.status = 'rejected';
      proposal.updatedAt = new Date().toISOString();
      return proposal;
    },

    markRunning(proposalId: string): void {
      const proposal = proposals.get(proposalId);
      if (proposal) {
        proposal.status = 'running';
        proposal.updatedAt = new Date().toISOString();
      }
    },

    markComplete(proposalId: string): void {
      const proposal = proposals.get(proposalId);
      if (proposal) {
        proposal.status = 'complete';
        proposal.updatedAt = new Date().toISOString();
      }
    },

    getConsent(consentId: string): BreedingConsent | null {
      return consents.get(consentId) ?? null;
    },
  };
}

export type BreedingConsentStore = ReturnType<typeof createBreedingConsentStore>;
