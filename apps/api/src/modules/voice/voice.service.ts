import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import { toFile } from 'openai';
import type { ServerEnv } from '@hearme/config';
import type { ConversationCosts, Memory } from '@hearme/shared';
import { ENV } from '../../common/config/config.module';
import { AnthropicService } from '../../infrastructure/anthropic/anthropic.service';
import { ElevenLabsService } from '../../infrastructure/elevenlabs/elevenlabs.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { OpenAIService } from '../../infrastructure/openai/openai.service';
import { buildSystemPrompt } from './prompt';

export interface StartResult {
  conversationId: string;
  remainingSeconds: number;
}

export interface TurnResult {
  userText: string;
  assistantText: string;
  audioBase64: string;
  audioMimeType: string;
  costs: ConversationCosts;
  remainingSeconds: number;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Voice orchestration (turn-based). Each turn: STT → prompt(memory+style+lang)
 * → OpenAI chat → ElevenLabs TTS, with per-component cost metering and full
 * persistence to Firestore. Enforces the configurable daily free-minute budget.
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject(ENV) private readonly env: ServerEnv,
    private readonly openai: OpenAIService,
    private readonly anthropic: AnthropicService,
    private readonly elevenlabs: ElevenLabsService,
    private readonly firebase: FirebaseService,
  ) {}

  /** Start a conversation: pre-flight the budget and snapshot user settings. */
  async startConversation(uid: string): Promise<StartResult> {
    const remainingSeconds = await this.remainingSeconds(uid);
    if (remainingSeconds <= 0) throw new ForbiddenException('out_of_minutes');

    const settings = await this.getSettings(uid);
    const ref = this.firebase.db.collection('conversations').doc();
    await ref.set({
      userId: uid,
      language: settings.language ?? this.env.DEFAULT_LANGUAGE,
      voiceId: settings.voiceId ?? null,
      conversationStyle: settings.conversationStyle ?? null,
      durationSeconds: 0,
      startedAt: FieldValue.serverTimestamp(),
      endedAt: null,
      costs: { sttCost: 0, llmCost: 0, ttsCost: 0, totalCost: 0 },
      audioPath: null,
    });
    return { conversationId: ref.id, remainingSeconds };
  }

  /** Process one spoken turn end-to-end. */
  async processTurn(
    uid: string,
    conversationId: string,
    audio: Buffer,
    mimeType: string,
    durationMs: number,
  ): Promise<TurnResult> {
    const convRef = this.firebase.db.collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    const conv = convSnap.data();
    if (!convSnap.exists || conv?.userId !== uid) throw new NotFoundException('conversation');
    if (!conv?.voiceId) throw new ForbiddenException('no_voice_selected');

    const remainingBefore = await this.remainingSeconds(uid);
    if (remainingBefore <= 0) throw new ForbiddenException('out_of_minutes');

    const turnSeconds = Math.max(1, Math.round(durationMs / 1000));

    // 1) Speech-to-text (provider configurable: openai | elevenlabs)
    const { text: userText, cost: sttCost } = await this.transcribe(audio, mimeType, turnSeconds);

    if (!userText) {
      // Nothing heard — don't bill LLM/TTS; just report back.
      await this.addUsage(uid, convRef, turnSeconds, { sttCost, llmCost: 0, ttsCost: 0, totalCost: sttCost });
      return {
        userText: '',
        assistantText: '',
        audioBase64: '',
        audioMimeType: 'audio/mpeg',
        costs: { sttCost, llmCost: 0, ttsCost: 0, totalCost: sttCost },
        remainingSeconds: Math.max(0, remainingBefore - turnSeconds),
      };
    }

    // 2) Build prompt with history + memory + style + language
    const [history, memory] = await Promise.all([
      this.loadHistory(convRef),
      this.loadMemory(uid),
    ]);
    const systemPrompt = buildSystemPrompt({
      languageCode: conv.language,
      styleId: conv.conversationStyle ?? null,
      memory,
    });

    // 3) LLM (provider configurable: anthropic | openai)
    const { text: assistantText, cost: llmCost } = await this.chat(systemPrompt, history, userText);

    // 4) TTS
    const audioOut = await this.elevenlabs.tts(conv.voiceId, assistantText);
    const ttsCost = this.elevenlabs.ttsCost(assistantText);

    const costs: ConversationCosts = {
      sttCost,
      llmCost,
      ttsCost,
      totalCost: sttCost + llmCost + ttsCost,
    };

    // 5) Persist messages + costs + usage
    const messages = convRef.collection('messages');
    await messages.add({ role: 'user', content: userText, timestamp: FieldValue.serverTimestamp() });
    await messages.add({
      role: 'assistant',
      content: assistantText,
      timestamp: FieldValue.serverTimestamp(),
    });
    await this.addUsage(uid, convRef, turnSeconds, costs);

    return {
      userText,
      assistantText,
      audioBase64: audioOut.toString('base64'),
      audioMimeType: 'audio/mpeg',
      costs,
      remainingSeconds: Math.max(0, remainingBefore - turnSeconds),
    };
  }

  /** Finalize a conversation. Returns the conversationId for follow-up (reports). */
  async endConversation(uid: string, conversationId: string): Promise<{ conversationId: string }> {
    const convRef = this.firebase.db.collection('conversations').doc(conversationId);
    const snap = await convRef.get();
    if (!snap.exists || snap.data()?.userId !== uid) throw new NotFoundException('conversation');
    await convRef.set({ endedAt: FieldValue.serverTimestamp() }, { merge: true });
    // Phase 3 hooks report + memory generation here.
    return { conversationId };
  }

  // ── providers ──

  /** Transcribe a turn via the configured STT provider; returns text + USD cost. */
  private async transcribe(
    audio: Buffer,
    mimeType: string,
    seconds: number,
  ): Promise<{ text: string; cost: number }> {
    if (this.env.STT_PROVIDER === 'elevenlabs') {
      const text = await this.elevenlabs.transcribe(audio, mimeType);
      return { text, cost: this.elevenlabs.sttCost(seconds) };
    }
    const file = await toFile(audio, `turn.${this.ext(mimeType)}`, { type: mimeType });
    const transcription = await this.openai.client.audio.transcriptions.create({
      file,
      model: this.openai.sttModel,
    });
    return { text: (transcription.text ?? '').trim(), cost: this.openai.sttCost(seconds) };
  }

  /** Generate the assistant reply via the configured LLM provider; returns text + USD cost. */
  private async chat(
    systemPrompt: string,
    history: ChatMsg[],
    userText: string,
  ): Promise<{ text: string; cost: number }> {
    const maxTokens = 220;
    if (this.env.LLM_PROVIDER === 'anthropic') {
      const r = await this.anthropic.chat(systemPrompt, [...history, { role: 'user', content: userText }], maxTokens);
      return { text: r.text, cost: this.anthropic.llmCost(r.inputTokens, r.outputTokens) };
    }
    const completion = await this.openai.client.chat.completions.create({
      model: this.openai.chatModel,
      temperature: 0.8,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userText },
      ],
    });
    return {
      text: (completion.choices[0]?.message?.content ?? '').trim(),
      cost: this.openai.llmCost(
        completion.usage?.prompt_tokens ?? 0,
        completion.usage?.completion_tokens ?? 0,
      ),
    };
  }

  // ── helpers ──

  private async getSettings(uid: string): Promise<{
    language?: string;
    voiceId?: string;
    conversationStyle?: string;
  }> {
    const snap = await this.firebase.db
      .collection('users')
      .doc(uid)
      .collection('settings')
      .doc('preferences')
      .get();
    return (snap.data() as Record<string, string>) ?? {};
  }

  private async loadHistory(
    convRef: FirebaseFirestore.DocumentReference,
  ): Promise<ChatMsg[]> {
    const snap = await convRef.collection('messages').orderBy('timestamp', 'asc').limitToLast(20).get();
    return snap.docs.map((d) => {
      const m = d.data();
      return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content as string };
    });
  }

  private async loadMemory(uid: string): Promise<Memory | null> {
    if (!this.env.ENABLE_MEMORY) return null;
    const snap = await this.firebase.db.collection('memories').doc(uid).get();
    return snap.exists ? (snap.data() as Memory) : null;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Seconds left today under the configurable free-minute budget. */
  private async remainingSeconds(uid: string): Promise<number> {
    const budget = this.env.FREE_MINUTES_PER_DAY * 60;
    const snap = await this.firebase.db
      .collection('usage')
      .doc(uid)
      .collection('daily')
      .doc(this.today())
      .get();
    const used = (snap.data()?.secondsUsed as number) ?? 0;
    return Math.max(0, budget - used);
  }

  /** Atomically record metered time + costs on the conversation and daily usage. */
  private async addUsage(
    uid: string,
    convRef: FirebaseFirestore.DocumentReference,
    seconds: number,
    costs: ConversationCosts,
  ): Promise<void> {
    await convRef.set(
      {
        durationSeconds: FieldValue.increment(seconds),
        costs: {
          sttCost: FieldValue.increment(costs.sttCost),
          llmCost: FieldValue.increment(costs.llmCost),
          ttsCost: FieldValue.increment(costs.ttsCost),
          totalCost: FieldValue.increment(costs.totalCost),
        },
      },
      { merge: true },
    );
    await this.firebase.db
      .collection('usage')
      .doc(uid)
      .collection('daily')
      .doc(this.today())
      .set(
        {
          userId: uid,
          date: this.today(),
          secondsUsed: FieldValue.increment(seconds),
          totalCost: FieldValue.increment(costs.totalCost),
        },
        { merge: true },
      );
  }

  private ext(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
    return 'webm';
  }
}
