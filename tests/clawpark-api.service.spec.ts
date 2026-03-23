import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBreedingProposal,
  createBreedingRun,
  respondToBreedingProposalConsent,
  saveBreedingRun,
} from '../src/services/clawparkApi';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('clawparkApi breeding normalization', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes breeding run responses when child is null', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        runId: 'breed-123',
        status: 'complete',
        child: null,
        mutationOccurred: 0,
      }),
    );

    const result = await createBreedingRun('spec-a', 'spec-b', 'hello');

    expect(result).toEqual({
      runId: 'breed-123',
      status: 'complete',
      child: null,
      inheritanceMap: [],
      mutationOccurred: false,
    });
  });

  it('throws contract errors for malformed breeding run payloads', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'complete' }));

    await expect(createBreedingRun('spec-a', 'spec-b')).rejects.toThrow(
      'API contract error: missing runId',
    );
  });

  it('normalizes save payloads when child is null', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'breed-123',
        parent_a_id: 'spec-a',
        parent_b_id: 'spec-b',
        prompt: null,
        conversation_json: null,
        prediction_json: null,
        result_child_id: null,
        status: 'complete',
        created_at: '2026-03-20T00:00:00.000Z',
        saved: 1,
        child: null,
      }),
    );

    const saved = await saveBreedingRun('breed-123');

    expect(saved.child).toBeNull();
    expect(saved.saved).toBe(true);
    expect(saved.status).toBe('complete');
  });

  it('surfaces non-2xx save errors with status and body text', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));

    await expect(saveBreedingRun('breed-123')).rejects.toThrow('API 500: boom');
  });

  it('normalizes proposal responses from snake_case payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'prop-123',
        parent_a_id: 'spec-a',
        parent_b_id: 'spec-b',
        requester_id: 'discord-user-a',
        consent_status: 'pending',
        intent_id: 'intent-1',
        owner_relationship: 'cross-owner',
        consent_required: 1,
        consent_id: null,
        created_at: '2026-03-21T00:00:00.000Z',
        updated_at: '2026-03-21T00:00:00.000Z',
      }),
    );

    const proposal = await createBreedingProposal({
      parentAId: 'spec-a',
      parentBId: 'spec-b',
      intentId: 'intent-1',
    });

    expect(proposal).toEqual({
      proposalId: 'prop-123',
      parentAId: 'spec-a',
      parentBId: 'spec-b',
      requesterId: 'discord-user-a',
      consentStatus: 'pending',
      intentId: 'intent-1',
      ownerRelationship: 'cross-owner',
      consentRequired: true,
      consentId: null,
      createdAt: '2026-03-21T00:00:00.000Z',
      updatedAt: '2026-03-21T00:00:00.000Z',
    });
  });

  it('sends proposal consent response payload and normalizes result', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'prop-123',
        parent_a_id: 'spec-a',
        parent_b_id: 'spec-b',
        requester_id: 'discord-user-a',
        consent_status: 'approved',
        intent_id: 'intent-1',
        owner_relationship: 'cross-owner',
        consent_required: 1,
        consent_id: null,
        created_at: '2026-03-21T00:00:00.000Z',
        updated_at: '2026-03-21T00:10:00.000Z',
      }),
    );

    const proposal = await respondToBreedingProposalConsent('prop-123', 'approved');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/breeding/proposals/prop-123/consent',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(proposal.consentStatus).toBe('approved');
    expect(proposal.updatedAt).toBe('2026-03-21T00:10:00.000Z');
  });
});
