import { defineRouting } from 'next-intl/routing';

/**
 * Marketing-site locales. These drive URL routing (/en, /hi, /de …) and hreflang.
 * Kept in sync with the product's SUPPORTED_LANGUAGES. 'hinglish' is a product
 * conversation language but not a distinct marketing locale (maps to en for SEO).
 */
export const locales = ['en', 'hi', 'de', 'es', 'fr', 'ar', 'pt', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
