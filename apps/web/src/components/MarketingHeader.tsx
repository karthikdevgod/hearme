import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Logo } from './Logo';

/** Top navigation for marketing pages, matching the brand kit. */
export async function MarketingHeader() {
  const t = await getTranslations('nav');
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="HearMe home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <Link href="/pricing" className="hover:text-foreground">
            {t('pricing')}
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            {t('blog')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t('signIn')}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            {t('getStarted')}
          </Link>
        </div>
      </div>
    </header>
  );
}
