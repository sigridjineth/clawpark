import type { HomePayload } from '../types/home';
import type {
  BreedingIntent,
  BreedingRunRecord,
  BreedingRunResult,
  EligibilityResult,
  ImportRecord,
  ImportPreview,
  LineageTree,
  Specimen,
} from '../types/specimen';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function normalizeSpecimen(payload: unknown): Specimen {
  const data = payload as {
    id: string;
    name?: string;
    claw: Specimen['claw'];
    ownershipState: Specimen['ownershipState'];
    breedState: Specimen['breedState'];
    discordUserId?: string | null;
    importRecordId?: string | null;
    parentAId?: string | null;
    parentBId?: string | null;
    createdAt: string;
    updatedAt: string;
  };

  return {
    id: data.id,
    name: data.name ?? data.claw.name,
    claw: data.claw,
    ownershipState: data.ownershipState,
    breedState: data.breedState,
    discordUserId: data.discordUserId ?? null,
    importRecordId: data.importRecordId ?? null,
    parentAId: data.parentAId ?? null,
    parentBId: data.parentBId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function normalizeImportRecord(payload: unknown): ImportRecord {
  const data = payload as {
    id?: string;
    importId?: string;
    source_kind?: string;
    sourceKind?: string;
    uploaded_at?: string;
    uploadedAt?: string;
    included_files?: unknown;
    includedFiles?: unknown;
    ignored_files?: unknown;
    ignoredFiles?: unknown;
    warnings?: unknown;
    fingerprint?: string;
    parsed_specimen_id?: string | null;
    specimenId?: string | null;
    discord_user_id?: string | null;
    discordUserId?: string | null;
  };

  return {
    importId: data.importId ?? data.id ?? '',
    sourceKind: data.sourceKind ?? data.source_kind ?? 'openclaw_zip',
    uploadedAt: data.uploadedAt ?? data.uploaded_at ?? new Date(0).toISOString(),
    includedFiles: parseJsonArray(data.includedFiles ?? data.included_files),
    ignoredFiles: parseJsonArray(data.ignoredFiles ?? data.ignored_files),
    warnings: parseJsonArray(data.warnings),
    fingerprint: data.fingerprint ?? '',
    specimenId: data.specimenId ?? data.parsed_specimen_id ?? null,
    discordUserId: data.discordUserId ?? data.discord_user_id ?? null,
  };
}

function normalizeLineageNode(payload: unknown): LineageTree {
  const data = payload as {
    specimen: unknown;
    parentA?: unknown;
    parentB?: unknown;
  };

  return {
    specimen: normalizeSpecimen(data.specimen),
    parentA: data.parentA ? normalizeLineageNode(data.parentA) : null,
    parentB: data.parentB ? normalizeLineageNode(data.parentB) : null,
  };
}

function normalizeBreedingIntent(payload: unknown): BreedingIntent {
  const data = payload as {
    id?: string;
    intentId?: string;
    source_surface?: string;
    sourceSurface?: string;
    source_message?: string | null;
    sourceMessage?: string | null;
    requester_identity?: string | null;
    requesterIdentity?: string | null;
    target_specimen_ids?: unknown;
    targetSpecimenIds?: unknown;
    status?: string;
    suggested_candidates?: unknown;
    suggestedCandidates?: unknown;
    proposal_id?: string | null;
    proposalId?: string | null;
    run_id?: string | null;
    runId?: string | null;
    result_child_id?: string | null;
    resultChildId?: string | null;
    block_reason?: string | null;
    blockReason?: string | null;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
  };

  return {
    intentId: data.intentId ?? data.id ?? '',
    sourceSurface: data.sourceSurface ?? data.source_surface ?? 'web_ui',
    sourceMessage: data.sourceMessage ?? data.source_message ?? null,
    requesterIdentity: data.requesterIdentity ?? data.requester_identity ?? null,
    targetSpecimenIds: parseJsonArray(data.targetSpecimenIds ?? data.target_specimen_ids),
    status: data.status ?? 'intent_created',
    suggestedCandidates: (() => {
      const raw = data.suggestedCandidates ?? data.suggested_candidates;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw) as unknown;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    })(),
    proposalId: data.proposalId ?? data.proposal_id ?? null,
    runId: data.runId ?? data.run_id ?? null,
    resultChildId: data.resultChildId ?? data.result_child_id ?? null,
    blockReason: data.blockReason ?? data.block_reason ?? null,
    createdAt: data.createdAt ?? data.created_at ?? '',
    updatedAt: data.updatedAt ?? data.updated_at ?? data.createdAt ?? data.created_at ?? '',
  };
}

function normalizeEligibilityResult(payload: unknown): EligibilityResult {
  const data = payload as {
    eligible: boolean;
    parentA?: unknown;
    parentB?: unknown;
    reason?: string;
  };

  if (!data.eligible) {
    return {
      eligible: false,
      reason: data.reason ?? 'Not eligible',
    };
  }

  return {
    eligible: true,
    parentA: normalizeSpecimen(data.parentA),
    parentB: normalizeSpecimen(data.parentB),
  };
}

export async function getHome(): Promise<HomePayload> {
  return request<HomePayload>('/home');
}

export async function importOpenClaw(
  file: File,
  discordUserId?: string,
): Promise<ImportPreview> {
  const form = new FormData();
  form.append('file', file);
  if (discordUserId) form.append('discord_user_id', discordUserId);
  const res = await fetch(`${BASE}/imports/openclaw`, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  const payload = await res.json() as {
    specimen: unknown;
    importRecord: unknown;
  };

  return {
    specimen: normalizeSpecimen(payload.specimen),
    importRecord: normalizeImportRecord(payload.importRecord),
  };
}

export async function claimSpecimen(
  id: string,
  discordUserId?: string,
): Promise<Specimen> {
  const payload = await request<unknown>(`/specimens/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ discord_user_id: discordUserId }),
  });
  return normalizeSpecimen(payload);
}

export async function listSpecimens(): Promise<Specimen[]> {
  const payload = await request<{ specimens: unknown[]; total: number }>('/specimens');
  return payload.specimens.map((specimen) => normalizeSpecimen(specimen));
}

export async function getSpecimen(id: string): Promise<Specimen> {
  const payload = await request<unknown>(`/specimens/${id}`);
  return normalizeSpecimen(payload);
}

export async function checkEligibility(
  parentA: string,
  parentB: string,
): Promise<EligibilityResult> {
  const payload = await request<unknown>(
    `/breeding/eligibility?parentA=${encodeURIComponent(parentA)}&parentB=${encodeURIComponent(parentB)}`,
  );
  return normalizeEligibilityResult(payload);
}

export async function createBreedingRun(
  parentA: string,
  parentB: string,
  prompt?: string,
): Promise<BreedingRunResult> {
  const payload = await request<{
    runId: string;
    status: 'complete';
    child: unknown;
    inheritanceMap: BreedingRunResult['inheritanceMap'];
    mutationOccurred: boolean;
  }>('/breeding/runs', {
    method: 'POST',
    body: JSON.stringify({ parentA, parentB, prompt }),
  });

  return {
    runId: payload.runId,
    status: payload.status,
    child: payload.child ? normalizeSpecimen(payload.child) : null,
    inheritanceMap: payload.inheritanceMap,
    mutationOccurred: payload.mutationOccurred,
  };
}

export async function getBreedingRun(runId: string): Promise<BreedingRunRecord> {
  const payload = await request<{
    id: string;
    parent_a_id: string;
    parent_b_id: string;
    prompt: string | null;
    conversation_json: string | null;
    prediction_json: string | null;
    result_child_id: string | null;
    status: string;
    created_at: string;
  }>(`/breeding/runs/${runId}`);

  return {
    id: payload.id,
    parentAId: payload.parent_a_id,
    parentBId: payload.parent_b_id,
    prompt: payload.prompt,
    conversationJson: payload.conversation_json,
    predictionJson: payload.prediction_json,
    resultChildId: payload.result_child_id,
    status: payload.status,
    createdAt: payload.created_at,
  };
}

export async function saveBreedingRun(runId: string): Promise<BreedingRunRecord & { saved: boolean; child: Specimen | null }> {
  const payload = await request<{
    id: string;
    parent_a_id: string;
    parent_b_id: string;
    prompt: string | null;
    conversation_json: string | null;
    prediction_json: string | null;
    result_child_id: string | null;
    status: string;
    created_at: string;
    saved: number;
    child: unknown;
  }>(`/breeding/runs/${runId}/save`, { method: 'POST' });

  return {
    id: payload.id,
    parentAId: payload.parent_a_id,
    parentBId: payload.parent_b_id,
    prompt: payload.prompt,
    conversationJson: payload.conversation_json,
    predictionJson: payload.prediction_json,
    resultChildId: payload.result_child_id,
    status: payload.status,
    createdAt: payload.created_at,
    saved: Boolean(payload.saved),
    child: payload.child ? normalizeSpecimen(payload.child) : null,
  };
}

export async function getLineage(id: string): Promise<LineageTree> {
  const payload = await request<unknown>(`/lineages/${id}`);
  return normalizeLineageNode(payload);
}

export async function createIntent(
  sourceMessage: string,
  targetSpecimenIds?: string[],
): Promise<BreedingIntent> {
  const payload = await request<unknown>('/discord/intents', {
    method: 'POST',
    body: JSON.stringify({
      source_message: sourceMessage,
      target_specimen_ids: targetSpecimenIds,
    }),
  });
  return normalizeBreedingIntent(payload);
}
