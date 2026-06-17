'use client';

import { getFirebaseAuth } from './firebase';
import { env } from '@/env';

const BASE = env.NEXT_PUBLIC_API_URL;

/**
 * Calls the NestJS api, attaching the current user's Firebase ID token when
 * available. Throws on non-2xx with the server message.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = getFirebaseAuth().currentUser;
  const token = current ? await current.getIdToken() : null;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  // Some endpoints (204) return no body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
