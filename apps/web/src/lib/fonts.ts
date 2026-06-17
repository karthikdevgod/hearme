import { Poppins } from 'next/font/google';

/** HearMe brand typeface. Exposed as a CSS variable consumed by Tailwind's font-sans. */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});
