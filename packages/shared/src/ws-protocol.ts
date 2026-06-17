import { z } from 'zod';

/**
 * WebSocket message protocol for the live voice conversation (web ↔ NestJS gateway).
 * Client and server exchange these discriminated-union events. Audio is sent as
 * separate binary frames; these JSON events carry control + transcript state.
 */

// ── Client → Server ──
export const ClientStartSchema = z.object({
  type: z.literal('start'),
  conversationId: z.string().optional(),
});
export const ClientAudioEndSchema = z.object({
  type: z.literal('audio_end'), // user released push-to-talk; flush STT
});
export const ClientEndSchema = z.object({
  type: z.literal('end'), // end the whole conversation
});
export const ClientMessageSchema = z.discriminatedUnion('type', [
  ClientStartSchema,
  ClientAudioEndSchema,
  ClientEndSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ── Server → Client ──
export const ServerReadySchema = z.object({
  type: z.literal('ready'),
  conversationId: z.string(),
  remainingSeconds: z.number(),
});
export const ServerTranscriptSchema = z.object({
  type: z.literal('transcript'),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  final: z.boolean(),
});
export const ServerAudioMetaSchema = z.object({
  type: z.literal('audio_meta'), // precedes binary audio frames for one assistant turn
  mimeType: z.string(),
});
export const ServerUsageSchema = z.object({
  type: z.literal('usage'),
  remainingSeconds: z.number(),
});
export const ServerEndedSchema = z.object({
  type: z.literal('ended'),
  conversationId: z.string(),
  reason: z.enum(['user_ended', 'out_of_minutes', 'error']),
});
export const ServerErrorSchema = z.object({
  type: z.literal('error'),
  message: z.string(),
});
export const ServerMessageSchema = z.discriminatedUnion('type', [
  ServerReadySchema,
  ServerTranscriptSchema,
  ServerAudioMetaSchema,
  ServerUsageSchema,
  ServerEndedSchema,
  ServerErrorSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
