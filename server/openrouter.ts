// OpenRouter LLM API client.
// Uses OPENROUTER_API_KEY and OPENROUTER_MODEL from process.env.

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? '';
  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

  async function chat(messages: OpenRouterMessage[], systemPrompt?: string): Promise<string> {
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set.');
    }

    const allMessages: OpenRouterMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'ClawPark',
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        max_tokens: 512,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    return data.choices[0]?.message?.content ?? '';
  }

  return { chat };
}

export type OpenRouterClient = ReturnType<typeof createOpenRouterClient>;
