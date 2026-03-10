import { describe, expect, it } from 'vitest';

import { breed } from '../src/engine/breed';
import { buildLineageLayout } from '../src/components/Lineage/lineageLayout';
import { createParentPair } from './clawFixtures';

function createThirdParent() {
  const { parentA } = createParentPair();
  return {
    ...parentA,
    id: 'claw-003',
    name: 'Loom',
    archetype: 'The Systems Gardener',
    intro: 'I keep structure steady while new species emerge.',
  };
}

describe('lineage layout', () => {
  it('renders multi-generation ancestry for bred descendants', () => {
    const { parentA, parentB } = createParentPair();
    const parentC = createThirdParent();

    const childOne = breed({ parentA, parentB, seed: 11 }).child;
    const childTwo = breed({ parentA: childOne, parentB: parentC, seed: 29 }).child;

    const layout = buildLineageLayout(childTwo.id, [parentA, parentB, parentC, childOne, childTwo]);
    const clawIds = new Set(layout.nodes.map((node) => node.clawId));

    expect(clawIds.has(childTwo.id)).toBe(true);
    expect(clawIds.has(childOne.id)).toBe(true);
    expect(clawIds.has(parentA.id)).toBe(true);
    expect(clawIds.has(parentB.id)).toBe(true);
    expect(clawIds.has(parentC.id)).toBe(true);
    expect(layout.rows).toBeGreaterThanOrEqual(3);
    expect(layout.edges).toHaveLength(4);
  });

  it('keeps recursive lineage visible when a founder is reused in a later generation', () => {
    const { parentA, parentB } = createParentPair();

    const childOne = breed({ parentA, parentB, seed: 11 }).child;
    const childTwo = breed({ parentA: childOne, parentB: parentA, seed: 29 }).child;

    const layout = buildLineageLayout(childTwo.id, [parentA, parentB, childOne, childTwo]);
    const founderNodes = layout.nodes.filter((node) => node.clawId === parentA.id);

    expect(founderNodes).toHaveLength(2);
    expect(layout.nodes.some((node) => node.clawId === childOne.id)).toBe(true);
    expect(layout.edges).toHaveLength(4);
    expect(layout.rows).toBeGreaterThanOrEqual(3);
  });
});
