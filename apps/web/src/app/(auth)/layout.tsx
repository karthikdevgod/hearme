import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';
import { poppins } from '@/lib/fonts';
import '../globals.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-hero font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
