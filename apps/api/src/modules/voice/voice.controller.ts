import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { VoiceService } from './voice.service';

@UseGuards(FirebaseAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  /** Start a conversation (pre-flights the daily budget). */
  @Post('conversations')
  start(@CurrentUser() user: { uid: string }) {
    return this.voice.startConversation(user.uid);
  }

  /** Process one push-to-talk turn. Expects multipart: `audio` file + `durationMs`. */
  @Post('conversations/:id/turn')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 25 * 1024 * 1024 } }))
  turn(
    @CurrentUser() user: { uid: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('durationMs') durationMs: string,
  ) {
    if (!file) throw new BadRequestException('audio file is required');
    return this.voice.processTurn(user.uid, id, file.buffer, file.mimetype, Number(durationMs) || 0);
  }

  /** End a conversation. */
  @Post('conversations/:id/end')
  end(@CurrentUser() user: { uid: string }, @Param('id') id: string) {
    return this.voice.endConversation(user.uid, id);
  }
}
