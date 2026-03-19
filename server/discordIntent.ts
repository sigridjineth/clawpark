// Discord intent parser — converts Discord messages to ParsedIntent via OpenRouter.

import type { ParsedAction, ParsedIntent } from '../src/types/breedingIntent.ts';
import { createOpenRouterClient } from './openrouter.ts';

const INTENT_SYSTEM_PROMPT = `You are a breeding intent parser for ClawPark, a creature breeding system.
Parse user messages in Korean or English and extract their breeding intent.

Valid actions:
- "breed": User wants to breed two specific specimens (e.g., "breed X with Y", "저 놈이랑 breed해", "X이랑 Y breed해")
- "find_partner": User wants to find a breedable partner (e.g., "breed 가능한 상대 찾아줘", "find me a partner", "who can I breed?", "show me available specimens")
- "compare": User wants to compare two specimens (e.g., "이놈이랑 저놈이랑 breed하는게 어때?", "compare X and Y")
- "proceed": User is confirming/proceeding (e.g., "진행해", "proceed", "go ahead", "yes", "ok", "응", "do it", "let's go")
- "cancel": User wants to cancel (e.g., "취소해", "cancel", "stop", "no", "아니", "never mind")
- "greet": User is greeting or asking general questions (e.g., "hi", "hello", "what can you do?", "help", "안녕")
- "persuade": User wants the bot to persuade/invite another user to upload their OpenClaw ZIP (e.g., "persuade @user to upload", "ask @user to join", "invite @user", "tell @user to share their claw")
- "unknown": Cannot determine intent at all

Extract any specimen names mentioned (proper nouns like "Ember", "Nova", "Sage", "Bolt", "Glyph").

Respond ONLY with valid JSON:
{
  "action": "breed" | "find_partner" | "compare" | "proceed" | "cancel" | "greet" | "persuade" | "unknown",
  "mentionedNames": ["name1", "name2"]
}`;

export function stripBotPrefix(message: string): string {
  return message
    .replace(/<@!?\d+>/g, '')
    .replace(/^!breed\s*/i, '')
    .trim();
}

export async function parseDiscordMessage(rawMessage: string): Promise<ParsedIntent> {
  const cleaned = stripBotPrefix(rawMessage);

  if (!cleaned) {
    return { action: 'unknown', mentionedNames: [], rawMessage };
  }

  try {
    const client = createOpenRouterClient();
    const response = await client.chat([{ role: 'user', content: cleaned }], INTENT_SYSTEM_PROMPT);
    return parseOpenRouterResponse(response, rawMessage);
  } catch {
    return fallbackParse(cleaned, rawMessage);
  }
}

function parseOpenRouterResponse(response: string, rawMessage: string): ParsedIntent {
  const trimmed = response.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) return fallbackParse(trimmed, rawMessage);

  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
      action?: string;
      mentionedNames?: string[];
    };

    const validActions: ParsedAction[] = ['breed', 'find_partner', 'compare', 'proceed', 'cancel', 'greet', 'persuade', 'unknown'];
    const action: ParsedAction = validActions.includes(parsed.action as ParsedAction)
      ? (parsed.action as ParsedAction)
      : 'unknown';

    return {
      action,
      mentionedNames: Array.isArray(parsed.mentionedNames) ? parsed.mentionedNames.map(String) : [],
      rawMessage,
    };
  } catch {
    return fallbackParse(trimmed, rawMessage);
  }
}

function fallbackParse(text: string, rawMessage: string): ParsedIntent {
  const lower = text.toLowerCase();

  if (/persuade|invite|ask.*upload|tell.*upload|recruit|설득/.test(lower)) {
    return { action: 'persuade' as ParsedAction, mentionedNames: [], rawMessage };
  }
  if (/^(hi|hello|hey|안녕|help|what can you|how do|뭐|도움)/.test(lower)) {
    return { action: 'greet' as ParsedAction, mentionedNames: [], rawMessage };
  }
  if (/진행|proceed|go ahead|계속|yes|ok\b|okay|응|yep|do it|let'?s go/.test(lower)) {
    return { action: 'proceed', mentionedNames: [], rawMessage };
  }
  if (/취소|cancel|stop|abort|no\b|아니/.test(lower)) {
    return { action: 'cancel', mentionedNames: [], rawMessage };
  }
  if (/찾아|find.*partner|match|상대|partner/.test(lower)) {
    return { action: 'find_partner', mentionedNames: [], rawMessage };
  }
  if (/어때|compare|비교/.test(lower)) {
    return { action: 'compare', mentionedNames: [], rawMessage };
  }
  if (/breed|교배/.test(lower)) {
    const nameMatch = text.match(/breed\s+(\w+)\s+with\s+(\w+)/i);
    const names = nameMatch ? [nameMatch[1], nameMatch[2]] : [];
    return { action: 'breed', mentionedNames: names, rawMessage };
  }

  return { action: 'unknown', mentionedNames: [], rawMessage };
}
