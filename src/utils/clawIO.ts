import type { Claw } from '../types/claw';
import type { ClawBundle, MarketplaceBundle } from '../types/marketplace';

const STORAGE_KEY = 'clawpark-gallery';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

export function downloadBlobFile(blob: Blob, filename: string) {
  triggerDownload(blob, filename);
}

/** Save claws to localStorage. */
export function saveClawsToStorage(claws: Claw[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claws));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

/** Load claws from localStorage. Returns null if nothing saved. */
export function loadClawsFromStorage(): Claw[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Claw[];
  } catch {
    return null;
  }
}

/** Clear saved claws. */
export function clearClawStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Export a single Claw as a downloadable JSON file. */
export function exportClaw(claw: Claw) {
  downloadJson(claw, `claw-${claw.name.toLowerCase()}-gen${claw.generation}.json`);
}

/** Export all claws as a single JSON file. */
export function exportAllClaws(claws: Claw[]) {
  downloadJson(claws, 'clawpark-collection.json');
}

export function exportClawBundle(bundle: ClawBundle, filename: string) {
  downloadJson(bundle, filename);
}

/** Validate that a parsed object looks like a Claw. */
function isValidClaw(obj: unknown): obj is Claw {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.archetype === 'string' &&
    typeof c.generation === 'number' &&
    c.soul != null &&
    c.skills != null &&
    c.visual != null
  );
}

function isClawBundle(obj: unknown): obj is ClawBundle {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return record.kind === 'claw' && isValidClaw(record.claw) && typeof record.manifest === 'object' && record.manifest !== null;
}

function isMarketplaceBundle(obj: unknown): obj is MarketplaceBundle {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return record.kind === 'claw' || record.kind === 'skill';
}

/** Import claws from a JSON file. Returns imported claws or an error string. */
export function parseClawImport(json: string): { claws: Claw[] } | { error: string } {
  try {
    const parsed = JSON.parse(json);

    if (isClawBundle(parsed)) {
      return { claws: [parsed.claw] };
    }

    if (isMarketplaceBundle(parsed)) {
      if (parsed.kind === 'claw' && isValidClaw(parsed.claw)) {
        return { claws: [parsed.claw] };
      }
      return { error: 'This bundle contains a skill listing, not a claimable Claw.' };
    }

    if (isValidClaw(parsed)) {
      return { claws: [parsed] };
    }

    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isValidClaw);
      if (valid.length === 0) {
        return { error: 'No valid Claw data found in file.' };
      }
      return { claws: valid };
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { claws?: unknown[] }).claws)) {
      const valid = ((parsed as { claws: unknown[] }).claws ?? []).filter(isValidClaw);
      if (valid.length === 0) {
        return { error: 'No valid Claw data found in bundle.' };
      }
      return { claws: valid };
    }

    return { error: 'Unrecognized file format.' };
  } catch {
    return { error: 'Invalid JSON.' };
  }
}
