import { describe, expect, it } from 'vitest';
import type { Claw, ClawLineage, InheritanceRecord } from '../../types/claw';
import { buildLineageLayout } from './lineageLayout';

function makeRecord(label: string, origin: InheritanceRecord['origin']): InheritanceRecord {
  return {
    type: 'soul',
    traitId: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    origin,
  };
}

function makeLineage(parentA: string, parentB: string, inheritanceMap: InheritanceRecord[]): ClawLineage {
  return {
    parentA,
    parentB,
    inheritanceMap,
  };
}

function makeClaw(id: string, generation: number, lineage: ClawLineage | null = null): Claw {
  return {
    id,
    name: id,
    archetype: 'Prototype',
    generation,
    soul: {
      traits: [
        {
          id: `${id}-trait`,
          label: `${id} trait`,
          description: 'test trait',
          weight: 1,
          color: '#82D9FF',
          visualSymbol: { shapeModifier: 'symmetric', description: 'circle' },
        },
      ],
    },
    skills: {
      badges: [
        {
          id: `${id}-skill`,
          label: `${id} skill`,
          icon: 'sparkles',
          dominance: 1,
          color: '#FF9770',
        },
      ],
    },
    visual: {
      primaryColor: '#111111',
      secondaryColor: '#f5f5f5',
      shapeModifiers: ['symmetric'],
      pattern: 'solid',
      glowIntensity: 0.7,
    },
    intro: `${id} intro`,
    lineage,
  };
}

describe('buildLineageLayout', () => {
  it('extracts recursive multi-generation ancestry and summary groups', () => {
    const grandA = makeClaw('grand-a', 0);
    const grandB = makeClaw('grand-b', 0);
    const parentA = makeClaw('parent-a', 1, makeLineage(grandA.id, grandB.id, []));
    const parentB = makeClaw('parent-b', 0);
    const child = makeClaw(
      'child',
      2,
      makeLineage(parentA.id, parentB.id, [
        makeRecord('Careful', 'parentA'),
        makeRecord('Swift', 'parentB'),
        makeRecord('Balanced', 'both'),
        makeRecord('Glitch', 'mutation'),
      ]),
    );

    const layout = buildLineageLayout(child, [grandA, grandB, parentA, parentB]);

    expect(layout.maxDepth).toBe(2);
    expect(layout.nodes.filter((node) => node.depth === 1).map((node) => node.claw.id)).toEqual(['parent-a', 'parent-b']);
    expect(layout.nodes.filter((node) => node.depth === 2).map((node) => node.branchKey)).toEqual(['00', '01']);
    expect(layout.edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'parentA->root',
      'parentA.parentA->parentA',
      'parentA.parentB->parentA',
      'parentB->root',
    ]);
    expect(layout.groups.find((group) => group.origin === 'parentA')?.items).toEqual(['Careful']);
    expect(layout.groups.find((group) => group.origin === 'parentB')?.items).toEqual(['Swift']);
    expect(layout.groups.find((group) => group.origin === 'both')?.items).toEqual(['Balanced']);
    expect(layout.groups.find((group) => group.origin === 'mutation')?.items).toEqual(['Glitch']);
  });

  it('skips missing ancestors while preserving available edges', () => {
    const knownParent = makeClaw('known-parent', 0);
    const child = makeClaw('child', 1, makeLineage('missing-parent', knownParent.id, []));

    const layout = buildLineageLayout(child, [knownParent]);

    expect(layout.nodes.map((node) => node.claw.id)).toEqual(['child', 'known-parent']);
    expect(layout.edges).toEqual([{ from: 'parentB', to: 'root', origin: 'parentB' }]);
  });
});
