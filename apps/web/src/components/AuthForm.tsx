'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Logo } from './Logo';

/** Shared email/Google auth form for /login and /signup. */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      // AuthGate routes to /onboarding or /dashboard based on profile state.
      router.replace('/dashboard');
    } catch (e) {
      setError((e as Error).message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-3xl border bg-card p-8 shadow-soft">
        <Logo className="mb-6 justify-center" />
        <h1 className="text-center text-2xl font-bold">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          A safe space to talk, reflect, and feel heard.
        </p>

        <button
          onClick={() => run(signInWithGoogle)}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 font-medium shadow-card transition hover:bg-muted disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => (isSignup ? signUpWithEmail(email, password) : signInWithEmail(email, password)));
          }}
          className="space-y-3"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
          {error && <p className="text-sm text-warning">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account? ' : 'New to HearMe? '}
          <Link href={isSignup ? '/login' : '/signup'} className="font-medium text-primary">
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </div>
    </div>
  );
}
