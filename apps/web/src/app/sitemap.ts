import type { MetadataRoute } from 'next';
import { env } from '@/env';
import { locales, defaultLocale } from '@/i18n/routing';

const SITE = env.NEXT_PUBLIC_SITE_URL;

/** Indexable marketing routes. App routes (dashboard, etc.) are intentionally excluded. */
const ROUTES = ['', '/pricing', '/about', '/blog'];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of ROUTES) {
    const languages: Record<string, string> = {};
    for (const l of locales) {
      languages[l] = l === defaultLocale ? `${SITE}${route}` : `${SITE}/${l}${route}`;
    }
    entries.push({
      url: `${SITE}${route}`,
      changeFrequency: route === '/blog' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.7,
      alternates: { languages },
    });
  }
  return entries;
}
