// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  containsPlainBotReference,
  displayCandidateName,
  extractNumberSelections,
  formatCandidateSuggestionsReply,
  isCountQuestion,
  isExportQuestion,
  isInheritanceQuestion,
  formatCountReply,
  formatInheritanceReply,
  formatSpecimenSummary,
  extractLocalZipPath,
  isAllowedLocalZipPath,
  isLikelyPersuadeFollowUp,
  isSpecimenInventoryQuestion,
  isSpecimenDetailQuestion,
  wantsUseAllVisibleCandidates,
  resolvePersuadeTargets,
} from '../../server/discord-bot.ts';
import type { SpecimenProfile } from '../../src/types/breedingIntent.ts';

describe('discord bot helpers', () => {
  it('detects plain-text bot references without a real Discord mention token', () => {
    expect(containsPlainBotReference('Hey @clawpark-demo can you help?', ['clawpark-demo'])).toBe(true);
    expect(containsPlainBotReference('clawpark-demo please do again', ['clawpark-demo'])).toBe(true);
    expect(containsPlainBotReference('hello there', ['clawpark-demo'])).toBe(false);
  });

  it('extracts local zip paths from message content', () => {
    expect(extractLocalZipPath("I've got the zip packaged at /tmp/magiclabs-spark.zip")).toBe('/tmp/magiclabs-spark.zip');
    expect(extractLocalZipPath('upload ready at ./exports/agent.zip')).toBe('./exports/agent.zip');
    expect(extractLocalZipPath('no zip here')).toBeNull();
  });

  it('only allows local zip handoff from safe dev paths', () => {
    expect(isAllowedLocalZipPath('/tmp/magiclabs-spark.zip')).toBe(true);
    expect(isAllowedLocalZipPath('./marketplace-data/upload.zip')).toBe(true);
    expect(isAllowedLocalZipPath('/etc/passwd')).toBe(false);
    expect(isAllowedLocalZipPath('/tmp/not-a-zip.txt')).toBe(false);
  });

  it('recognizes likely persuade follow-up phrases', () => {
    expect(isLikelyPersuadeFollowUp('this guy')).toBe(true);
    expect(isLikelyPersuadeFollowUp('do again')).toBe(true);
    expect(isLikelyPersuadeFollowUp('check above zip file')).toBe(true);
    expect(isLikelyPersuadeFollowUp('how many claws are there')).toBe(false);
  });

  it('falls back to remembered persuade targets for follow-up prompts', () => {
    const remembered = [{ id: '1', displayName: 'magiclabs-spark' }];
    expect(resolvePersuadeTargets([], remembered, 'this guy')).toEqual(remembered);
    expect(resolvePersuadeTargets([], remembered, 'do again')).toEqual(remembered);
    expect(resolvePersuadeTargets([{ id: '2', displayName: 'dgxspark' }], remembered, 'this guy')).toEqual([
      { id: '2', displayName: 'dgxspark' },
    ]);
  });

  it('detects inventory/list-claws questions', () => {
    expect(isSpecimenInventoryQuestion('what claws you have? name all of.')).toBe(true);
    expect(isSpecimenInventoryQuestion('show me available specimens')).toBe(true);
    expect(isSpecimenInventoryQuestion('hello there')).toBe(false);
  });

  it('detects count/detail/inheritance/export intents with simple heuristics', () => {
    expect(isCountQuestion('how many claws in the registry?')).toBe(true);
    expect(isSpecimenDetailQuestion('tell me the details of new Quartz')).toBe(true);
    expect(isInheritanceQuestion('what things changed/inherited from its parent')).toBe(true);
    expect(isExportQuestion('can you make it downloadable zip file for quartz?')).toBe(true);
  });

  it('extracts numbered selections and the use-both shorthand', () => {
    expect(extractNumberSelections('can you breed 1 and 2')).toEqual([1, 2]);
    expect(extractNumberSelections('use 2 then 1')).toEqual([2, 1]);
    expect(wantsUseAllVisibleCandidates('okay got for 2 claws')).toBe(true);
  });

  it('falls back to specimen id when a candidate name is blank', () => {
    expect(displayCandidateName({ specimenId: 'spec-123', name: '' })).toBe('spec-123');
    expect(displayCandidateName({ specimenId: 'spec-123', name: 'Ridgeback' })).toBe('Ridgeback');
  });

  it('formats available-specimen replies with explicit names and no proceed shortcut', () => {
    const message = formatCandidateSuggestionsReply([
      {
        specimenId: 'spec-a',
        name: 'Ridgeback',
        compatibilitySummary: 'Available for breeding',
        eligibleForAutoApprove: false,
      },
      {
        specimenId: 'spec-b',
        name: 'Orchid Glass',
        compatibilitySummary: 'Available for breeding',
        eligibleForAutoApprove: false,
      },
    ], 'available-specimens');

    expect(message).toContain('**Ridgeback**');
    expect(message).toContain('**Orchid Glass**');
    expect(message).toContain('Reply with **two specimen names**');
    expect(message).not.toContain('say **"proceed"**');
  });

  it('formats partner-option replies with explicit names and proceed guidance', () => {
    const message = formatCandidateSuggestionsReply([
      {
        specimenId: 'spec-b',
        name: 'Orchid Glass',
        compatibilitySummary: 'Consent required',
        eligibleForAutoApprove: false,
      },
    ], 'partner-options', 'Ridgeback');

    expect(message).toContain('for **Ridgeback**');
    expect(message).toContain('**Orchid Glass**');
    expect(message).toContain('say **"proceed"**');
  });

  it('formats count replies with separated registry/owned/breedable counts', () => {
    const message = formatCountReply([
      { id: '1', name: 'khl7q5', ownerId: 'user-a', breedable: true },
      { id: '2', name: 'dgxspark-claw', ownerId: 'user-b', breedable: true },
      { id: '3', name: 'Quartz', ownerId: 'user-a', breedable: false },
    ], 'user-a');
    expect(message).toContain('Registry claws: 3');
    expect(message).toContain('Owned by you: 2');
    expect(message).toContain('Breedable right now: 2');
  });

  it('formats deterministic specimen details and inheritance summaries', () => {
    const profile: SpecimenProfile = {
      id: 'spec-quartz',
      name: 'Quartz',
      ownerId: 'user-a',
      breedable: true,
      ownershipState: 'claimed',
      breedState: 'ready',
      parentAId: 'spec-a',
      parentBId: 'spec-b',
      claw: {
        id: 'spec-quartz',
        name: 'Quartz',
        archetype: 'The Systems Gardener',
        generation: 1,
        identity: {
          creature: 'Signal Raptor',
          role: 'Systems Gardener',
          directive: 'Grow structured systems.',
          vibe: 'Calm',
          emoji: '🌱',
        },
        soul: { traits: [{ id: 'trait-analysis', label: 'Analysis', description: '', weight: 1, color: '#fff', visualSymbol: { shapeModifier: 'geometric', description: '' } }] },
        skills: { badges: [{ id: 'skill-review', label: 'Review', icon: '🔍', dominance: 1, color: '#fff' }] },
        tools: { loadout: [{ id: 'tool-search-probe', label: 'Search Probe', icon: '🔎', description: '', potency: 1, color: '#fff' }] },
        visual: { primaryColor: '#fff', secondaryColor: '#000', shapeModifiers: ['geometric'], pattern: 'solid', glowIntensity: 0.5 },
        intro: 'Quartz intro',
        lineage: {
          parentA: 'spec-a',
          parentB: 'spec-b',
          inheritanceMap: [
            { type: 'soul', traitId: 'trait-analysis', label: 'Analysis', origin: 'parentA' },
          ],
        },
      },
    };

    const details = formatSpecimenSummary(profile);
    expect(details).toContain('**Quartz**');
    expect(details).toContain('Archetype: The Systems Gardener');
    expect(details).toContain('Soul traits: Analysis');

    const inheritance = formatInheritanceReply(profile, {
      resolveSpecimenByName: () => null,
      resolveSpecimenById: (id) => ({ id, name: id === 'spec-a' ? 'khl7q5' : 'dgxspark-claw', ownerId: null, breedable: true }),
      listBreedableSpecimens: () => [],
      runBreed: async () => ({ runId: '1', childId: '2', childName: 'Quartz', lineageSummary: 'x' }),
    });
    expect(inheritance).toContain('Parent A: khl7q5');
    expect(inheritance).toContain('Analysis (soul) ← parentA');
  });
});
