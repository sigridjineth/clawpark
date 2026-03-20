// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fallbackParse, rescueActionableIntent, stripBotPrefix } from '../../server/discordIntent.ts';

describe('discord intent parsing', () => {
  it('keeps strong breed heuristics available for random breed requests', () => {
    const parsed = fallbackParse('can you randomly pick 2 of 3 then breed with them', 'raw');
    expect(parsed.action).toBe('breed');
  });

  it('rescues actionable intents when the LLM misclassifies them as greet/unknown', () => {
    const rescued = rescueActionableIntent(
      { action: 'greet', mentionedNames: [], rawMessage: '@clawpark-demo can you randomly pick 2 of 3 then breed with them' },
      'can you randomly pick 2 of 3 then breed with them',
    );
    expect(rescued.action).toBe('breed');
  });

  it('strips discord mention prefixes before downstream intent checks', () => {
    expect(stripBotPrefix('<@12345> breed Quartz with khl7q5')).toBe('breed Quartz with khl7q5');
  });
});
