'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { env } from '@/env';

/**
 * Lazily initialized Firebase client. Initialization is deferred until first
 * use in the browser so that server prerendering (which has no public keys)
 * never constructs the SDK. Always call getFirebaseAuth() from client code.
 */
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const googleProvider = new GoogleAuthProvider();

let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);

  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR === 'true') {
    connectAuthEmulator(cachedAuth, 'http://localhost:9099', { disableWarnings: true });
  }
  return cachedAuth;
}
