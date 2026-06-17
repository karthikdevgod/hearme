import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Providers } from '@/lib/providers';
import { poppins } from '@/lib/fonts';
import '../globals.css';

/**
 * Authenticated app shell. NOT indexed — SEO lives on the marketing surface only.
 * Client-rendered with auth gating + React Query.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}
