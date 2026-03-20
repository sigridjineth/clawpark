// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  containsPlainBotReference,
  displayCandidateName,
  formatCandidateSuggestionsReply,
  extractLocalZipPath,
  isAllowedLocalZipPath,
  isLikelyPersuadeFollowUp,
  isSpecimenInventoryQuestion,
  resolvePersuadeTargets,
} from '../../server/discord-bot.ts';

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
});
