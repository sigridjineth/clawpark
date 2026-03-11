import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from '../src/App';
import { INITIAL_CLAWS } from '../src/data/claws';
import { breed } from '../src/engine/breed';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

const GENOME_DIMENSIONS = ['identity', 'soul', 'skills', 'tools'] as const;
type GenomeDimension = (typeof GENOME_DIMENSIONS)[number];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function getDimension(subject: unknown, dimension: GenomeDimension) {
  return asRecord(subject)?.[dimension];
}

function expectNonEmptyDimension(value: unknown) {
  if (Array.isArray(value)) {
    expect(value.length).toBeGreaterThan(0);
    return;
  }

  if (typeof value === 'string') {
    expect(value.trim().length).toBeGreaterThan(0);
    return;
  }

  if (value && typeof value === 'object') {
    expect(Object.keys(value as Record<string, unknown>).length).toBeGreaterThan(0);
    return;
  }

  expect(value).toBeTruthy();
}

function expectGenomeDimensions(subject: unknown) {
  for (const dimension of GENOME_DIMENSIONS) {
    expectNonEmptyDimension(getDimension(subject, dimension));
  }
}

function normalizeDimensionTag(value: unknown): GenomeDimension | null {
  if (typeof value !== 'string') {
    return null;
  }

  switch (value.toLowerCase()) {
    case 'identity':
      return 'identity';
    case 'soul':
      return 'soul';
    case 'skill':
    case 'skills':
      return 'skills';
    case 'tool':
    case 'tools':
      return 'tools';
    default:
      return null;
  }
}

function collectLineageDimensions(records: unknown) {
  const dimensions = new Set<GenomeDimension>();

  if (!Array.isArray(records)) {
    return dimensions;
  }

  for (const record of records) {
    const shape = asRecord(record);
    const dimension = normalizeDimensionTag(shape?.dimension) ?? normalizeDimensionTag(shape?.type);

    if (dimension) {
      dimensions.add(dimension);
    }
  }

  return dimensions;
}

function stableClone(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableClone(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableClone(entry)]),
    );
  }

  return value;
}

function projectGenome(subject: unknown) {
  return Object.fromEntries(
    GENOME_DIMENSIONS.map((dimension) => [dimension, stableClone(getDimension(subject, dimension))]),
  );
}

function expectGenomeLabelsOnScreen() {
  for (const dimension of GENOME_DIMENSIONS) {
    expect(screen.getAllByText(new RegExp(`\\b${dimension}\\b`, 'i')).length).toBeGreaterThan(0);
  }
}

describe('ClawPark OpenClaw genome contracts', () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  it('breed() returns a child genome with identity, soul, skills, and tools lineage data', () => {
    const [parentA, parentB] = INITIAL_CLAWS;
    const result = breed({
      parentA,
      parentB,
      seed: 42,
      demoMode: true,
    });

    expect(result.child.lineage).toMatchObject({
      parentA: parentA.id,
      parentB: parentB.id,
    });
    expectGenomeDimensions(result.child);

    const lineageDimensions = collectLineageDimensions(result.inheritanceMap);

    for (const dimension of GENOME_DIMENSIONS) {
      expect(lineageDimensions.has(dimension)).toBe(true);
    }
  });

  it('keeps the demo showcase deterministic across the full genome projection', () => {
    const [parentA, parentB] = INITIAL_CLAWS;
    const request = {
      parentA,
      parentB,
      seed: 42,
      demoMode: true,
      breedCount: 0,
    } as const;

    const first = breed(request);
    const second = breed(request);

    expectGenomeDimensions(first.child);
    expect(projectGenome(first.child)).toEqual(projectGenome(second.child));
  });

  it('surfaces the four OpenClaw genome dimensions through the lab and lineage flow', async () => {
    const [parentA, parentB] = INITIAL_CLAWS;

    window.history.replaceState({}, '', '/?demo=true');
    render(createElement(App));

    const enterBreedLab = await screen.findByRole('button', { name: /Enter Breed Lab/i });
    await waitFor(() => expect(enterBreedLab).toBeEnabled());

    const parentASelect = screen.queryByRole('button', { name: new RegExp(`^Select ${parentA.name}$`, 'i') });
    if (parentASelect) {
      fireEvent.click(parentASelect);
    }
    const parentBSelect = screen.queryByRole('button', { name: new RegExp(`^Select ${parentB.name}$`, 'i') });
    if (parentBSelect) {
      fireEvent.click(parentBSelect);
    }
    fireEvent.click(enterBreedLab);

    expectGenomeLabelsOnScreen();
    expect(screen.getByText(/Operator prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/Fusion/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Guide the breeding process/i), {
      target: { value: 'Tell me how this child should behave in the park.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Talk to Parents/i }));
    expect(document.body.textContent?.toLowerCase()).toMatch(/should behave in the park/);

    fireEvent.click(await screen.findByRole('button', { name: /Initiate Breeding/i }));

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe('birth');
      expect(useClawStore.getState().breedResult?.child.name).toBe('Ember');
    });

    act(() => {
      useClawStore.getState().setBirthPhase('complete');
    });

    fireEvent.click(await screen.findByRole('button', { name: /View Lineage/i }));

    expect(await screen.findByText(/Lineage/i)).toBeInTheDocument();
    expectGenomeLabelsOnScreen();
    expect(screen.getByText(/Breeding transcript/i)).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).toMatch(/inherit|fuse|mutat/);
  });
});
