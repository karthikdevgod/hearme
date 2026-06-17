import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import { ClientMessageSchema, type ServerMessage } from '@hearme/shared';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { VoiceService } from './voice.service';

/**
 * Live voice conversation gateway (Phase 2). One WebSocket per active conversation.
 *
 * Wire protocol: JSON control/transcript frames (see @hearme/shared ws-protocol)
 * interleaved with binary audio frames. Client streams mic audio (binary) +
 * `audio_end` to flush a turn; server streams back `transcript` + `audio_meta`
 * followed by binary TTS audio, then `usage`.
 *
 * Orchestration (STT → memory+prompt → OpenAI → ElevenLabs) lives in VoiceService.
 */
@WebSocketGateway({ path: '/voice' })
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(VoiceGateway.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly voice: VoiceService,
  ) {}

  async handleConnection(socket: WebSocket, ...args: unknown[]): Promise<void> {
    // Authenticate via ?token=<Firebase ID token> on the upgrade request.
    const req = args[0] as { url?: string } | undefined;
    const token = new URL(req?.url ?? '', 'http://localhost').searchParams.get('token');
    if (!token) return this.close(socket, 'Missing token');

    try {
      const decoded = await this.firebase.verifyIdToken(token);
      const session = await this.voice.openSession(decoded.uid);
      this.send(socket, {
        type: 'ready',
        conversationId: session.conversationId,
        remainingSeconds: session.remainingSeconds,
      });

      socket.on('message', (data, isBinary) => {
        if (isBinary) {
          void this.voice.ingestAudio(session, data as Buffer);
          return;
        }
        const parsed = ClientMessageSchema.safeParse(JSON.parse(data.toString()));
        if (!parsed.success) return this.send(socket, { type: 'error', message: 'Bad message' });
        void this.voice.handleClientMessage(session, parsed.data, (m) => this.send(socket, m));
      });
    } catch (err) {
      this.logger.warn(`Voice auth failed: ${(err as Error).message}`);
      this.close(socket, 'Unauthorized');
    }
  }

  handleDisconnect(socket: WebSocket): void {
    void this.voice.closeSocket(socket);
  }

  private send(socket: WebSocket, msg: ServerMessage): void {
    socket.send(JSON.stringify(msg));
  }

  private close(socket: WebSocket, reason: string): void {
    this.send(socket, { type: 'error', message: reason });
    socket.close();
  }
}
