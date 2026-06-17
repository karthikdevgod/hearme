import { Inject, Injectable, Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';
import type { ServerEnv } from '@hearme/config';
import type { ClientMessage, ServerMessage } from '@hearme/shared';
import { ENV } from '../../common/config/config.module';
import { ElevenLabsService } from '../../infrastructure/elevenlabs/elevenlabs.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { OpenAIService } from '../../infrastructure/openai/openai.service';

export interface VoiceSession {
  uid: string;
  conversationId: string;
  remainingSeconds: number;
  startedAt: number;
}

/**
 * Voice orchestration (Phase 2). Owns the per-turn pipeline and cost metering:
 *   ingestAudio → STT (OpenAI)            [meter sttCost]
 *   build prompt (memory + style + lang)
 *   chat (OpenAI, streamed)               [meter llmCost]
 *   sentence-chunked TTS (ElevenLabs)     [meter ttsCost]
 *   persist transcript/audio/costs, decrement minutes
 *
 * Phase 0 ships the session lifecycle + metering scaffolding; the streaming
 * pipeline is implemented in Phase 2.
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject(ENV) private readonly env: ServerEnv,
    private readonly openai: OpenAIService,
    private readonly elevenlabs: ElevenLabsService,
    private readonly firebase: FirebaseService,
  ) {}

  /** Pre-flight: check remaining minutes and create a conversation document. */
  async openSession(uid: string): Promise<VoiceSession> {
    const remainingSeconds = await this.remainingSeconds(uid);
    const ref = this.firebase.db.collection('conversations').doc();
    // Phase 2 fills language/voice/style from user settings.
    return { uid, conversationId: ref.id, remainingSeconds, startedAt: Date.now() };
  }

  async ingestAudio(session: VoiceSession, _chunk: Buffer): Promise<void> {
    // Phase 2: buffer audio, run streaming STT on `audio_end`.
    void session;
  }

  async handleClientMessage(
    session: VoiceSession,
    msg: ClientMessage,
    send: (m: ServerMessage) => void,
  ): Promise<void> {
    switch (msg.type) {
      case 'start':
        return; // session already opened on connection
      case 'audio_end':
        // Phase 2: STT → LLM → TTS turn.
        return;
      case 'end':
        send({ type: 'ended', conversationId: session.conversationId, reason: 'user_ended' });
        return;
    }
  }

  async closeSocket(_socket: WebSocket): Promise<void> {
    // Phase 2: finalize duration, persist costs, decrement usage.
  }

  /** Remaining seconds for the day based on plan/free-tier config and usage. */
  private async remainingSeconds(_uid: string): Promise<number> {
    // Phase 2/4: read usage rollup + plan; for now grant the free daily allotment.
    return this.env.FREE_MINUTES_PER_DAY * 60;
  }
}
