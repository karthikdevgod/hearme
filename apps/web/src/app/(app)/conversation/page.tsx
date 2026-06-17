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

type Status = 'connecting' | 'idle' | 'recording' | 'processing' | 'speaking' | 'error';

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Start the conversation on mount.
  useEffect(() => {
    let active = true;
    apiFetch<StartResult>('/voice/conversations', { method: 'POST' })
      .then((r) => {
        if (!active) return;
        setConversationId(r.conversationId);
        setRemaining(r.remainingSeconds);
        setStatus('idle');
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e.message).includes('out_of_minutes') ? "You're out of minutes for today." : e.message);
        setStatus('error');
      });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Elapsed timer.
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const startRecording = useCallback(async () => {
    if (status !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => void handleTurn(mime);
      recorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.start();
      setStatus('recording');
    } catch {
      setError('Microphone access is needed to talk. Please allow it and try again.');
      setStatus('error');
    }
  }, [status]);

  const stopRecording = useCallback(() => {
    if (status !== 'recording') return;
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('processing');
  }, [status]);

  async function handleTurn(mime: string) {
    if (!conversationId) return;
    const durationMs = Date.now() - recordStartRef.current;
    const blob = new Blob(chunksRef.current, { type: mime });
    if (blob.size < 1000 || durationMs < 400) {
      setStatus('idle');
      return;
    }
    try {
      const form = new FormData();
      form.append('audio', blob, `turn.${mime.includes('mp4') ? 'mp4' : 'webm'}`);
      form.append('durationMs', String(durationMs));
      const r = await apiUpload<TurnResult>(`/voice/conversations/${conversationId}/turn`, form);
      setRemaining(r.remainingSeconds);
      if (r.userText) setLines((l) => [...l, { role: 'user', text: r.userText }]);
      if (r.assistantText) setLines((l) => [...l, { role: 'assistant', text: r.assistantText }]);

      if (r.audioBase64) {
        const audio = new Audio(`data:${r.audioMimeType};base64,${r.audioBase64}`);
        audioRef.current = audio;
        setStatus('speaking');
        audio.onended = () => setStatus('idle');
        audio.onerror = () => setStatus('idle');
        await audio.play().catch(() => setStatus('idle'));
      } else {
        setStatus('idle');
      }
    } catch (e) {
      const msg = String((e as Error).message);
      setError(msg.includes('out_of_minutes') ? "You're out of minutes for today." : msg);
      setStatus('idle');
    }
  }

  async function endConversation() {
    audioRef.current?.pause();
    try {
      if (conversationId) await apiFetch(`/voice/conversations/${conversationId}/end`, { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.replace('/dashboard');
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isRecording = status === 'recording';
  const busy = status === 'processing' || status === 'speaking';

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
            Hold the mic and start talking. HearMe is listening.
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
        <div className="h-6 text-sm font-medium text-muted-foreground">
          {status === 'connecting' && 'Connecting…'}
          {status === 'recording' && 'Listening… release to send'}
          {status === 'processing' && 'Thinking…'}
          {status === 'speaking' && 'Speaking…'}
          {status === 'idle' && 'Hold to talk'}
        </div>

        <div className="flex items-center gap-8">
          <button
            disabled={status !== 'idle' && status !== 'recording'}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => isRecording && stopRecording()}
            onTouchStart={(e) => {
              e.preventDefault();
              void startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRecording();
            }}
            className={`relative grid h-24 w-24 select-none place-items-center rounded-full text-primary-foreground shadow-soft transition disabled:opacity-50 ${
              isRecording ? 'scale-110 bg-warning' : 'bg-brand-gradient'
            }`}
          >
            {isRecording && (
              <span className="absolute inset-0 animate-ping rounded-full bg-warning/40" />
            )}
            {busy ? (
              status === 'speaking' ? (
                <Volume2 className="h-9 w-9" />
              ) : (
                <Loader2 className="h-9 w-9 animate-spin" />
              )
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </button>

          <button
            onClick={endConversation}
            aria-label="End conversation"
            className="grid h-14 w-14 place-items-center rounded-full bg-card text-foreground shadow-card transition hover:bg-muted"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
