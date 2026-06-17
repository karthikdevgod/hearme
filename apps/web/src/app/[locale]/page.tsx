import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BarChart3, Brain, Check, Lock, Mic } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { Logo } from '@/components/Logo';
import { MarketingHeader } from '@/components/MarketingHeader';
import { faqJsonLd, organizationJsonLd, pageMetadata, websiteJsonLd } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ title: t('title'), description: t('description'), path: '/', locale });
}

const FEATURES = [
  { key: 'voice', Icon: Mic },
  { key: 'memory', Icon: Brain },
  { key: 'reports', Icon: BarChart3 },
  { key: 'private', Icon: Lock },
] as const;

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hero');
  const tf = await getTranslations('features');
  const tfaq = await getTranslations('faq');

  const faqs = [
    { q: tfaq('q1.q'), a: tfaq('q1.a') },
    { q: tfaq('q2.q'), a: tfaq('q2.a') },
  ];
  const badges = ['10 min/day free for 6 days', 'No credit card required', 'Private & Secure'];

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="bg-hero">
          <div className="container grid items-center gap-12 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-primary">
                ✨ {t('eyebrow')}
              </span>
              <h1 className="mt-6 text-balance text-5xl font-bold leading-tight tracking-tight">
                {t('title')}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t('subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
                >
                  {t('ctaPrimary')}
                </Link>
                <a href="#how" className="rounded-xl border bg-card px-6 py-3 font-semibold shadow-card">
                  {t('ctaSecondary')}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {badges.map((b) => (
                  <li key={b} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-success" /> {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero card */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-3xl bg-brand-gradient p-1 shadow-soft">
                <div className="rounded-[1.4rem] bg-card p-8">
                  <div className="flex items-center justify-center">
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-gradient text-primary-foreground">
                      <Logo withWordmark={false} size={40} className="text-white" />
                    </span>
                  </div>
                  <p className="mt-6 text-center text-lg font-medium">“A safe space to talk.”</p>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Talk about anything on your mind. HearMe listens, understands, and supports you.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="container pb-12 text-center text-sm text-muted-foreground">
            {t('disclaimer')}
          </p>
        </section>

        {/* Features */}
        <section id="features" className="container py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">{tf('title')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ key, Icon }) => (
              <div key={key} className="rounded-2xl border bg-card p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{tf(`${key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tf(`${key}.body`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="how" className="container py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">{tfaq('title')}</h2>
          <div className="mx-auto max-w-2xl space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border bg-card p-6 shadow-card">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t">
          <div className="container flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
            <Logo />
            <p className="text-sm text-muted-foreground">
              © {2026} HearMe — A safe space to talk, reflect, and feel heard.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
