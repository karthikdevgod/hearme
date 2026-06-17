import type { MetadataRoute } from 'next';
import { env } from '@/env';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    short_name: env.NEXT_PUBLIC_APP_NAME,
    description: 'A safe space to talk, reflect, and feel heard.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#5B5BEF',
  };
}
