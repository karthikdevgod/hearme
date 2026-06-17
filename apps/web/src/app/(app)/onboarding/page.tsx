'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Play } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface LanguageMeta { code: string; label: string; nativeLabel: string }
interface StyleMeta { id: string; label: string; description: string }
interface Voice { id: string; name: string; accent: string | null; gender: string | null; previewUrl: string | null }
interface Options { languages: LanguageMeta[]; styles: StyleMeta[] }

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [conversationStyle, setStyle] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: options } = useQuery<Options>({
    queryKey: ['onboarding-options'],
    queryFn: () => apiFetch<Options>('/onboarding/options'),
  });
  const { data: voices } = useQuery<Voice[]>({
    queryKey: ['onboarding-voices'],
    queryFn: () => apiFetch<Voice[]>('/onboarding/voices'),
    enabled: step === 1,
  });

  const complete = useMutation({
    mutationFn: () =>
      apiFetch('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({ language, voiceId, conversationStyle }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.replace('/dashboard');
    },
  });

  function playPreview(url: string | null) {
    if (!url) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    void audio.play();
  }

  const steps = ['Language', 'Voice', 'Style'];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Logo className="mb-8 justify-center" />

      {/* Stepper */}
      <ol className="mb-10 flex items-center justify-center gap-4">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={i === step ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
          </li>
        ))}
      </ol>

      {/* Step 1: Language */}
      {step === 0 && (
        <section>
          <h1 className="mb-6 text-center text-2xl font-bold">Which language feels like home?</h1>
          <div className="grid gap-3 sm:grid-cols-3">
            {options?.languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`rounded-2xl border bg-card p-4 text-left shadow-card transition ${
                  language === l.code ? 'ring-2 ring-primary' : 'hover:bg-muted'
                }`}
              >
                <div className="font-semibold">{l.nativeLabel}</div>
                <div className="text-sm text-muted-foreground">{l.label}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: Voice */}
      {step === 1 && (
        <section>
          <h1 className="mb-6 text-center text-2xl font-bold">Pick a voice you’ll enjoy</h1>
          {!voices && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
          <div className="grid gap-3 sm:grid-cols-2">
            {voices?.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between rounded-2xl border bg-card p-4 shadow-card transition ${
                  voiceId === v.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <button className="text-left" onClick={() => setVoiceId(v.id)}>
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {[v.gender, v.accent].filter(Boolean).join(' · ') || 'Voice'}
                  </div>
                </button>
                {v.previewUrl && (
                  <button
                    onClick={() => playPreview(v.previewUrl)}
                    aria-label={`Preview ${v.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-primary hover:bg-accent/25"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Style */}
      {step === 2 && (
        <section>
          <h1 className="mb-6 text-center text-2xl font-bold">How should HearMe show up for you?</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {options?.styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`rounded-2xl border bg-card p-4 text-left shadow-card transition ${
                  conversationStyle === s.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                }`}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.description}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border px-5 py-2.5 font-medium disabled:opacity-40"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 0 && !language) || (step === 1 && !voiceId)}
            className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground shadow-soft disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => complete.mutate()}
            disabled={!conversationStyle || complete.isPending}
            className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground shadow-soft disabled:opacity-40"
          >
            {complete.isPending ? 'Saving…' : 'Start talking'}
          </button>
        )}
      </div>
    </div>
  );
}
