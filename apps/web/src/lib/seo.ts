import type { Metadata } from 'next';
import { env } from '@/env';
import { locales, defaultLocale, type Locale } from '@/i18n/routing';

const SITE = env.NEXT_PUBLIC_SITE_URL;
const APP = env.NEXT_PUBLIC_APP_NAME;

/** Build hreflang alternates for a given path across all marketing locales. */
export function alternates(path: string, locale: Locale): Metadata['alternates'] {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = l === defaultLocale ? `${SITE}${clean}` : `${SITE}/${l}${clean}`;
  }
  languages['x-default'] = `${SITE}${clean}`;
  return {
    canonical: locale === defaultLocale ? `${SITE}${clean}` : `${SITE}/${locale}${clean}`,
    languages,
  };
}

/** Compose page metadata with OpenGraph + Twitter defaults. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  noindex?: boolean;
}): Metadata {
  return {
    metadataBase: new URL(SITE),
    title: opts.title,
    description: opts.description,
    alternates: alternates(opts.path, opts.locale),
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      siteName: APP,
      title: opts.title,
      description: opts.description,
      url: opts.path,
      locale: opts.locale,
    },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description },
  };
}

/** JSON-LD for the Organization + WebSite (rendered on the landing page). */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP,
    url: SITE,
    description: 'A voice-first AI conversation companion for reflection and emotional support.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP,
    url: SITE,
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}
