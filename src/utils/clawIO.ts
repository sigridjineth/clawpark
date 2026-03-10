import type { Claw } from '../types/claw';

const STORAGE_KEY = 'clawpark-gallery';

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
  const data = JSON.stringify(claw, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `claw-${claw.name.toLowerCase()}-gen${claw.generation}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export all claws as a single JSON file. */
export function exportAllClaws(claws: Claw[]) {
  const data = JSON.stringify(claws, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clawpark-collection.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

/** Import claws from a JSON file. Returns imported claws or an error string. */
export function parseClawImport(json: string): { claws: Claw[] } | { error: string } {
  try {
    const parsed = JSON.parse(json);

    // Single claw
    if (isValidClaw(parsed)) {
      return { claws: [parsed] };
    }

    // Array of claws
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isValidClaw);
      if (valid.length === 0) {
        return { error: 'No valid Claw data found in file.' };
      }
      return { claws: valid };
    }

    return { error: 'Unrecognized file format.' };
  } catch {
    return { error: 'Invalid JSON.' };
  }
}
