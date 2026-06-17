/** Language metadata used by both onboarding (product language) and marketing i18n. */
export interface LanguageMeta {
  /** Internal code, also used as marketing-site locale where applicable. */
  code: string;
  /** English label. */
  label: string;
  /** Native label (for the language picker). */
  nativeLabel: string;
  /** BCP-47 tag for hreflang / speech APIs. */
  bcp47: string;
  /** Right-to-left script. */
  rtl: boolean;
}

export const LANGUAGES: Record<string, LanguageMeta> = {
  en: { code: 'en', label: 'English', nativeLabel: 'English', bcp47: 'en', rtl: false },
  hi: { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', bcp47: 'hi', rtl: false },
  hinglish: { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish', bcp47: 'hi', rtl: false },
  de: { code: 'de', label: 'German', nativeLabel: 'Deutsch', bcp47: 'de', rtl: false },
  es: { code: 'es', label: 'Spanish', nativeLabel: 'Español', bcp47: 'es', rtl: false },
  fr: { code: 'fr', label: 'French', nativeLabel: 'Français', bcp47: 'fr', rtl: false },
  ar: { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', bcp47: 'ar', rtl: true },
  pt: { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', bcp47: 'pt', rtl: false },
  ja: { code: 'ja', label: 'Japanese', nativeLabel: '日本語', bcp47: 'ja', rtl: false },
};

/** Conversation style metadata. Used in onboarding + system-prompt assembly. */
export interface ConversationStyleMeta {
  id: string;
  label: string;
  description: string;
  /** Injected into the system prompt to shape tone. */
  promptDirective: string;
}

export const CONVERSATION_STYLES: ConversationStyleMeta[] = [
  {
    id: 'calm_listener',
    label: 'Calm Listener',
    description: 'Gentle, unhurried, mostly listens and reflects back.',
    promptDirective:
      'Adopt a calm, unhurried tone. Listen more than you speak. Reflect feelings back and leave space.',
  },
  {
    id: 'supportive_friend',
    label: 'Supportive Friend',
    description: 'Warm, encouraging, casual and caring.',
    promptDirective:
      'Be warm, casual and encouraging, like a trusted friend. Validate feelings and gently encourage.',
  },
  {
    id: 'motivational_coach',
    label: 'Motivational Coach',
    description: 'Energetic, action-oriented, helps set small goals.',
    promptDirective:
      'Be energetic and action-oriented. Help the user name small, achievable next steps and celebrate progress.',
  },
  {
    id: 'career_mentor',
    label: 'Career Mentor',
    description: 'Pragmatic, structured, focused on growth and decisions.',
    promptDirective:
      'Be pragmatic and structured. Help the user think through decisions, trade-offs, and professional growth.',
  },
  {
    id: 'mindfulness_guide',
    label: 'Mindfulness Guide',
    description: 'Grounding, present-focused, breathing and awareness.',
    promptDirective:
      'Be grounding and present-focused. Gently guide toward breath, body awareness, and the present moment.',
  },
];

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const PLAN_IDS = ['free', 'basic', 'pro'] as const;
export type PlanId = (typeof PLAN_IDS)[number];
