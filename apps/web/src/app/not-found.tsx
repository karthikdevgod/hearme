import Link from 'next/link';
import { poppins } from '@/lib/fonts';
import './globals.css';

/**
 * Root not-found — handles unmatched routes outside the [locale], (app), and
 * (auth) trees, and backs Next's generated /404 + /_error pages. Because this app
 * uses multiple root layouts (one per route group) with no app/layout.tsx, this
 * file must render its own <html>/<body>; otherwise Next falls back to the
 * Pages-Router error page, which imports <Html> and breaks the production build.
 */
export default function NotFound() {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <main className="container flex min-h-screen flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-semibold">Page not found</h1>
          <p className="mt-3 text-muted-foreground">This page doesn’t exist or has moved.</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground"
          >
            Back home
          </Link>
        </main>
      </body>
    </html>
  );
}
