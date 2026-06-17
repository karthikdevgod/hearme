'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Logo } from './Logo';

interface Me {
  uid: string;
  onboardingComplete: boolean;
}

/** Gates authed routes: redirects unauthenticated users to /login and
 *  not-yet-onboarded users to /onboarding. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { data: me } = useQuery<Me>({
    queryKey: ['me', user?.uid],
    queryFn: () => apiFetch<Me>('/users/me'),
    enabled: !!user,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (me && !me.onboardingComplete && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [loading, user, me, pathname, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Logo withWordmark={false} size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
