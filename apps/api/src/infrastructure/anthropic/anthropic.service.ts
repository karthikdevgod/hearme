import { Inject, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { ServerEnv } from '@hearme/config';
import { ENV } from '../../common/config/config.module';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Anthropic (Claude) wrapper for the conversation LLM. Short, empathetic voice
 * replies don't need extended thinking, so we keep latency low and omit the
 * thinking parameter (allowed on Opus 4.8). Model is env-configurable.
 */
@Injectable()
export class AnthropicService {
  readonly client: Anthropic;

  constructor(@Inject(ENV) private readonly env: ServerEnv) {
    this.client = new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY || 'sk-ant-noop' });
  }

  get model(): string {
    return this.env.ANTHROPIC_MODEL;
  }

  /** One chat completion. Returns the assistant text and token usage for metering. */
  async chat(
    system: string,
    messages: ChatTurn[],
    maxTokens: number,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
      .trim();
    return {
      text,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
    };
  }

  /** USD cost for an LLM turn given token counts. */
  llmCost(inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens / 1_000_000) * this.env.ANTHROPIC_INPUT_COST_PER_1M +
      (outputTokens / 1_000_000) * this.env.ANTHROPIC_OUTPUT_COST_PER_1M
    );
  }
}
