import { hashStringToSeed } from './random';

export const DEMO_SEED = 42;
export const DEMO_PARENT_IDS = ['claw-001', 'claw-002'] as const;

export function isDemoModeFromSearch(search?: string) {
  if (typeof window === 'undefined' && !search) {
    return false;
  }

  const params = new URLSearchParams(search ?? window.location.search);
  return params.get('demo') === 'true';
}

export function isDemoMode(search?: string) {
  return isDemoModeFromSearch(search);
}

export function updateDemoModeQuery(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set('demo', 'true');
  } else {
    url.searchParams.delete('demo');
  }
  window.history.replaceState({}, '', url);
}

export function attachDemoShortcut(toggle: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      toggle();
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export function resolveBreedSeed(
  parentAId: string,
  parentBId: string,
  preferredTraitId: string | undefined,
  demoMode: boolean,
  breedCount: number,
) {
  if (demoMode) {
    return DEMO_SEED + breedCount;
  }

  return hashStringToSeed([parentAId, parentBId, preferredTraitId ?? 'none', `${Date.now()}`].join(':'));
}

export function isDemoShowcasePair(parentAId: string, parentBId: string) {
  const ids = [parentAId, parentBId].sort().join('|');
  return ids === [...DEMO_PARENT_IDS].sort().join('|');
}

export function isDemoPair(parentAId: string, parentBId: string) {
  return isDemoShowcasePair(parentAId, parentBId);
}
