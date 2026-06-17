'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mic, PhoneOff, Volume2 } from 'lucide-react';
import { apiFetch, apiUpload } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface StartResult {
  conversationId: string;
  remainingSeconds: number;
}
interface TurnResult {
  userText: string;
  assistantText: string;
  audioBase64: string;
  audioMimeType: string;
  remainingSeconds: number;
}
interface Line {
  role: 'user' | 'assistant';
  text: string;
}

type Status = 'connecting' | 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

// Voice-activity-detection tuning.
const SPEECH_THRESHOLD = 0.015; // RMS above this counts as speech
const SILENCE_MS = 1300; // silence after speech that ends a turn
const MIN_TURN_MS = 500;

function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}

export default function ConversationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('connecting');
  const [live, setLive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Refs (read inside async callbacks where state would be stale).
  const conversationIdRef = useRef<string | null>(null);
  const liveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Start the conversation (budget pre-flight) on mount.
  useEffect(() => {
    let active = true;
    apiFetch<StartResult>('/voice/conversations', { method: 'POST' })
      .then((r) => {
        if (!active) return;
        conversationIdRef.current = r.conversationId;
        setRemaining(r.remainingSeconds);
        setStatus('ready');
      })
      .catch((e) => {
        if (!active) return;
        setError(
          String(e.message).includes('out_of_minutes')
            ? "You're out of minutes for today."
            : e.message,
        );
        setStatus('error');
      });
    return () => {
      active = false;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => liveRef.current && setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  function teardown() {
    liveRef.current = false;
    if (monitorRef.current) clearInterval(monitorRef.current);
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    } catch {
      /* noop */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    playerRef.current?.pause();
    void audioCtxRef.current?.close().catch(() => {});
  }

  // One listening turn: record while the user speaks, stop after trailing silence.
  const listenTurn = useCallback(() => {
    if (!liveRef.current || !streamRef.current || !analyserRef.current) return;
    setStatus('listening');
    const mime = pickMime();
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current = recorder;
    chunksRef.current = [];
    const startedAt = Date.now();
    let hasSpoken = false;
    let silenceStart = 0;

    recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      if (monitorRef.current) clearInterval(monitorRef.current);
      void handleTurn(mime, Date.now() - startedAt, hasSpoken);
    };
    recorder.start();

    const analyser = analyserRef.current;
    const buf = new Uint8Array(analyser.fftSize);
    monitorRef.current = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) {
        const d = (v - 128) / 128;
        sum += d * d;
      }
      const rms = Math.sqrt(sum / buf.length);
      const now = Date.now();
      if (rms > SPEECH_THRESHOLD) {
        hasSpoken = true;
        silenceStart = 0;
      } else if (hasSpoken) {
        if (!silenceStart) silenceStart = now;
        else if (now - silenceStart > SILENCE_MS && recorder.state === 'recording') recorder.stop();
      }
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTurn(mime: string, durationMs: number, hasSpoken: boolean) {
    const conversationId = conversationIdRef.current;
    // Nothing meaningful said — just keep listening.
    if (!hasSpoken || durationMs < MIN_TURN_MS || !conversationId) {
      if (liveRef.current) listenTurn();
      return;
    }
    setStatus('processing');
    try {
      const blob = new Blob(chunksRef.current, { type: mime });
      const form = new FormData();
      form.append('audio', blob, `turn.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
      form.append('durationMs', String(durationMs));
      const r = await apiUpload<TurnResult>(`/voice/conversations/${conversationId}/turn`, form);
      setRemaining(r.remainingSeconds);
      if (r.userText) setLines((l) => [...l, { role: 'user', text: r.userText }]);
      if (r.assistantText) setLines((l) => [...l, { role: 'assistant', text: r.assistantText }]);

      if (r.audioBase64) {
        const audio = new Audio(`data:${r.audioMimeType};base64,${r.audioBase64}`);
        playerRef.current = audio;
        setStatus('speaking');
        const resume = () => (liveRef.current ? listenTurn() : setStatus('ready'));
        audio.onended = resume;
        audio.onerror = resume;
        await audio.play().catch(resume);
      } else if (liveRef.current) {
        listenTurn();
      }
    } catch (e) {
      const msg = String((e as Error).message);
      if (msg.includes('out_of_minutes')) {
        setError("You're out of minutes for today.");
        teardown();
        setStatus('error');
      } else if (liveRef.current) {
        listenTurn(); // transient error — keep the conversation going
      }
    }
  }

  async function startConversation() {
    if (status !== 'ready') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      liveRef.current = true;
      setLive(true);
      listenTurn();
    } catch {
      setError('Microphone access is needed to talk. Please allow it and try again.');
      setStatus('error');
    }
  }

  async function endConversation() {
    teardown();
    setLive(false);
    setStatus('ready');
    try {
      if (conversationIdRef.current)
        await apiFetch(`/voice/conversations/${conversationIdRef.current}/end`, { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.replace('/dashboard');
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const statusLabel: Record<Status, string> = {
    connecting: 'Connecting…',
    ready: 'Tap to start talking',
    listening: 'Listening…',
    processing: 'Thinking…',
    speaking: 'Speaking…',
    error: '',
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>⏱ {mmss(elapsed)}</span>
          <span>{Math.ceil(remaining / 60)} min left</span>
        </div>
      </div>

      {/* Transcript */}
      <div className="my-6 flex-1 space-y-3 overflow-y-auto">
        {lines.length === 0 && status !== 'error' && (
          <p className="mt-20 text-center text-muted-foreground">
            Tap the button below and just talk — HearMe listens and replies on its own.
          </p>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              l.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-card shadow-card'
            }`}
          >
            {l.text}
          </div>
        ))}
        {error && (
          <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 pb-4">
        <div className="h-6 text-sm font-medium text-muted-foreground">{statusLabel[status]}</div>

        {!live ? (
          <button
            onClick={startConversation}
            disabled={status !== 'ready'}
            className="flex items-center gap-3 rounded-full bg-brand-gradient px-8 py-4 text-lg font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            {status === 'connecting' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
            Start talking
          </button>
        ) : (
          <div className="flex items-center gap-8">
            {/* Live status orb */}
            <div
              className={`relative grid h-24 w-24 place-items-center rounded-full text-primary-foreground shadow-soft ${
                status === 'listening' ? 'bg-brand-gradient' : 'bg-primary'
              }`}
            >
              {status === 'listening' && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              )}
              {status === 'speaking' ? (
                <Volume2 className="h-9 w-9" />
              ) : status === 'processing' ? (
                <Loader2 className="h-9 w-9 animate-spin" />
              ) : (
                <Mic className="h-9 w-9" />
              )}
            </div>

            <button
              onClick={endConversation}
              aria-label="End conversation"
              className="grid h-14 w-14 place-items-center rounded-full bg-card text-foreground shadow-card transition hover:bg-muted"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
