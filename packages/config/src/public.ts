import { z } from 'zod';
import { zStrList } from './helpers';

/**
 * Public (NEXT_PUBLIC_*) env schema. Safe to use in client components.
 * Contains no secrets. Next.js inlines these at build time, so they must be
 * referenced statically — see apps/web/src/env.ts for the bound object.
 */
export function loadPublicEnv(raw: Record<string, string | undefined>) {
  const schema = z.object({
    NEXT_PUBLIC_APP_NAME: z.string().default('HearMe'),
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),

    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional().default(''),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional().default(''),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional().default(''),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional().default(''),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional().default(''),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional().default(''),

    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),

    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(''),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(''),

    NEXT_PUBLIC_SUPPORTED_LANGUAGES: zStrList([
      'en',
      'hi',
      'hinglish',
      'de',
      'es',
      'fr',
      'ar',
      'pt',
      'ja',
    ]),
    NEXT_PUBLIC_DEFAULT_LANGUAGE: z.string().default('en'),
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid public environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export type PublicEnv = ReturnType<typeof loadPublicEnv>;
