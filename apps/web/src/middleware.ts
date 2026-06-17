import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Run i18n routing on marketing routes only. Exclude api, static assets, files
  // with an extension, and the authenticated app + admin (which are not localized).
  matcher: [
    '/((?!api|_next|_vercel|dashboard|conversation|reports|billing|settings|admin|onboarding|signup|login|.*\\..*).*)',
  ],
};
