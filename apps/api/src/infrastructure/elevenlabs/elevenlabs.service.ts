import { Inject, Injectable } from '@nestjs/common';
import type { ServerEnv } from '@hearme/config';
import type { Voice } from '@hearme/shared';
import { ENV } from '../../common/config/config.module';

const BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * ElevenLabs wrapper: list voices (for onboarding) and stream TTS (for the voice
 * pipeline). Uses fetch directly to keep the dependency surface small. Exposes a
 * cost helper for ttsCost metering based on character count.
 */
@Injectable()
export class ElevenLabsService {
  constructor(@Inject(ENV) private readonly env: ServerEnv) {}

  private headers(): Record<string, string> {
    return { 'xi-api-key': this.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' };
  }

  /** Fetch available voices, mapped to our shared Voice shape. */
  async listVoices(): Promise<Voice[]> {
    const res = await fetch(`${BASE_URL}/voices`, { headers: this.headers() });
    if (!res.ok) throw new Error(`ElevenLabs listVoices failed: ${res.status}`);
    const data = (await res.json()) as { voices: ElevenLabsVoice[] };
    return data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      accent: v.labels?.accent ?? null,
      gender: v.labels?.gender ?? null,
      previewUrl: v.preview_url ?? null,
      labels: v.labels ?? {},
    }));
  }

  /** Stream synthesized speech for `text` in the given voice as a ReadableStream. */
  async streamTts(voiceId: string, text: string): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ text, model_id: this.env.ELEVENLABS_MODEL }),
    });
    if (!res.ok || !res.body) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
    return res.body;
  }

  /** Synthesize `text` and return the full MP3 audio buffer (turn-based pipeline). */
  async tts(voiceId: string, text: string): Promise<Buffer> {
    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { ...this.headers(), Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: this.env.ELEVENLABS_MODEL }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`ElevenLabs TTS failed: ${res.status} ${detail.slice(0, 200)}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  /** USD cost for synthesizing `text`. */
  ttsCost(text: string): number {
    return (text.length / 1000) * this.env.ELEVENLABS_TTS_COST_PER_1K_CHARS;
  }
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: Record<string, string>;
}
