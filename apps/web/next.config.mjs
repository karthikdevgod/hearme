import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';

// Load the monorepo-root .env so NEXT_PUBLIC_* vars are available to Next's
// build-time inlining (Next only reads .env from the app dir by default).
const dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(dirname, '../../.env') });

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@hearme/shared', '@hearme/config'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // Security headers across the whole site.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
