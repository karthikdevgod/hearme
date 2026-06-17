import { z } from 'zod';
import { zBool, zNum, zNumList, zStrList, zSecret } from './helpers';

/**
 * Server-side env schema. Use only from the NestJS api or Next.js server runtime.
 * NEVER import this into client components — it contains secrets.
 */
export function loadServerEnv(raw: Record<string, string | undefined> = process.env) {
  const isProd = raw.NODE_ENV === 'production';

  const schema = z.object({
    // App
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_NAME: z.string().default('HearMe'),
    API_PORT: zNum(4000),
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),

    // Free tier / trial
    FREE_MINUTES_PER_DAY: zNum(10),
    FREE_TRIAL_DAYS: zNum(6),

    // Monetization
    ENABLE_PAYG: zBool(true),
    ENABLE_SUBSCRIPTIONS: zBool(true),
    PAYG_PRICE_PER_MINUTE: zNum(0.1),
    CREDITS_PER_MINUTE: zNum(1),
    CREDIT_PACKS: zNumList([5, 10, 20]),

    // Plans
    BASIC_PLAN_PRICE: zNum(9.99),
    BASIC_PLAN_MINUTES: zNum(300),
    PRO_PLAN_PRICE: zNum(19.99),
    PRO_PLAN_MINUTES: zNum(999999),

    // Feature flags
    ENABLE_MEMORY: zBool(true),
    ENABLE_REPORTS: zBool(true),
    ENABLE_MOOD_ANALYSIS: zBool(true),
    ENABLE_AUDIO_STORAGE: zBool(true),
    ENABLE_PHONE_LOGIN: zBool(false),
    ENABLE_EMAIL_LOGIN: zBool(true),
    ENABLE_GOOGLE_LOGIN: zBool(true),

    // Languages
    SUPPORTED_LANGUAGES: zStrList(['en', 'hi', 'hinglish', 'de', 'es', 'fr', 'ar', 'pt', 'ja']),
    DEFAULT_LANGUAGE: z.string().default('en'),

    // Retention
    AUDIO_RETENTION_DAYS: zNum(30),

    // OpenAI
    OPENAI_API_KEY: zSecret(isProd),
    OPENAI_CHAT_MODEL: z.string().default('gpt-4o'),
    OPENAI_STT_MODEL: z.string().default('gpt-4o-transcribe'),
    OPENAI_LLM_INPUT_COST_PER_1M: zNum(2.5),
    OPENAI_LLM_OUTPUT_COST_PER_1M: zNum(10),
    OPENAI_STT_COST_PER_MINUTE: zNum(0.006),

    // ElevenLabs
    ELEVENLABS_API_KEY: zSecret(isProd),
    ELEVENLABS_MODEL: z.string().default('eleven_multilingual_v2'),
    ELEVENLABS_TTS_COST_PER_1K_CHARS: zNum(0.3),

    // Stripe
    STRIPE_SECRET_KEY: zSecret(isProd),
    STRIPE_WEBHOOK_SECRET: zSecret(isProd),

    // Firebase Admin
    FIREBASE_PROJECT_ID: zSecret(isProd),
    FIREBASE_CLIENT_EMAIL: zSecret(isProd),
    FIREBASE_PRIVATE_KEY: zSecret(isProd),
    FIREBASE_STORAGE_BUCKET: z.string().optional().default(''),

    // Emulators
    FIREBASE_AUTH_EMULATOR_HOST: z.string().optional().default(''),
    FIRESTORE_EMULATOR_HOST: z.string().optional().default(''),
    FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional().default(''),

    // Monitoring
    SENTRY_DSN: z.string().optional().default(''),

    // Security
    RATE_LIMIT_TTL: zNum(60),
    RATE_LIMIT_MAX: zNum(120),
    CORS_ORIGINS: zStrList(['http://localhost:3000']),
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }

  // Firebase private keys arrive with escaped newlines from most secret stores.
  const env = parsed.data;
  env.FIREBASE_PRIVATE_KEY = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  return env;
}

export type ServerEnv = ReturnType<typeof loadServerEnv>;
