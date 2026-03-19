import type { HomePayload } from '../types/home';
import type {
  BreedingIntent,
  BreedingRun,
  EligibilityResult,
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

export async function getHome(): Promise<HomePayload> {
  return request<HomePayload>('/home');
}

export async function importOpenClaw(
  file: File,
  discordUserId?: string,
): Promise<ImportPreview> {
  const form = new FormData();
  form.append('file', file);
  if (discordUserId) form.append('discordUserId', discordUserId);
  const res = await fetch(`${BASE}/imports/openclaw`, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<ImportPreview>;
}

export async function claimSpecimen(
  id: string,
  discordUserId?: string,
): Promise<Specimen> {
  return request<Specimen>(`/specimens/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ discordUserId }),
  });
}

export async function listSpecimens(): Promise<Specimen[]> {
  return request<Specimen[]>('/specimens');
}

export async function getSpecimen(id: string): Promise<Specimen> {
  return request<Specimen>(`/specimens/${id}`);
}

export async function checkEligibility(
  parentA: string,
  parentB: string,
): Promise<EligibilityResult> {
  return request<EligibilityResult>(
    `/breeding/eligibility?parentA=${encodeURIComponent(parentA)}&parentB=${encodeURIComponent(parentB)}`,
  );
}

export async function createBreedingRun(
  parentA: string,
  parentB: string,
  prompt?: string,
): Promise<BreedingRun> {
  return request<BreedingRun>('/breeding/runs', {
    method: 'POST',
    body: JSON.stringify({ parentA, parentB, prompt }),
  });
}

export async function saveBreedingRun(runId: string): Promise<Specimen> {
  return request<Specimen>(`/breeding/runs/${runId}/save`, { method: 'POST' });
}

export async function getLineage(id: string): Promise<LineageTree> {
  return request<LineageTree>(`/specimens/${id}/lineage`);
}

export async function createIntent(
  intent: string,
  targetSpecimenIds?: string[],
): Promise<BreedingIntent> {
  return request<BreedingIntent>('/breeding/intents', {
    method: 'POST',
    body: JSON.stringify({ intent, targetSpecimenIds }),
  });
}
