import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';

/** Voice module (Phase 2): turn-based STT→LLM→TTS pipeline + cost metering. */
@Module({
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}
