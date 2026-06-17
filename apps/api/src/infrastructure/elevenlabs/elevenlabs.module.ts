import { Global, Module } from '@nestjs/common';
import { ElevenLabsService } from './elevenlabs.service';

@Global()
@Module({
  providers: [ElevenLabsService],
  exports: [ElevenLabsService],
})
export class ElevenLabsModule {}
