import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { VoiceService } from './voice.service';

/** Voice module (Phase 2 core): WebSocket gateway + streaming STT→LLM→TTS orchestration. */
@Module({
  providers: [VoiceGateway, VoiceService],
})
export class VoiceModule {}
