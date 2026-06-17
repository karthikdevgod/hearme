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

/**
 * Uploads multipart form data (e.g. a recorded audio turn) with the Firebase ID
 * token attached. Lets the browser set the multipart Content-Type + boundary.
 */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const current = getFirebaseAuth().currentUser;
  const token = current ? await current.getIdToken() : null;
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
