import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { cert, getApps, initializeApp, type App, type AppOptions } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { ServerEnv } from '@hearme/config';
import { ENV } from '../../common/config/config.module';

/**
 * Single Firebase Admin entrypoint. Wraps auth/firestore/storage so the rest of
 * the app never imports firebase-admin directly. Honors emulator env vars in dev.
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: App;
  auth!: Auth;
  db!: Firestore;
  storage!: Storage;
  /** True once Firebase is usable (cert or emulator present). */
  ready = false;

  constructor(@Inject(ENV) private readonly env: ServerEnv) {}

  onModuleInit(): void {
    const useEmulator =
      !!this.env.FIRESTORE_EMULATOR_HOST || !!this.env.FIREBASE_AUTH_EMULATOR_HOST;
    const hasCert = !!this.env.FIREBASE_PRIVATE_KEY && !!this.env.FIREBASE_CLIENT_EMAIL;

    if (getApps().length) {
      this.app = getApps()[0]!;
    } else {
      // Build options without an undefined `credential` field — the Admin SDK
      // rejects an explicit `credential: undefined`.
      const options: AppOptions = {
        projectId: this.env.FIREBASE_PROJECT_ID || 'hearme-local',
      };
      if (this.env.FIREBASE_STORAGE_BUCKET) {
        options.storageBucket = this.env.FIREBASE_STORAGE_BUCKET;
      }
      // With emulators, the Admin SDK reads *_EMULATOR_HOST and needs no creds.
      if (!useEmulator && hasCert) {
        options.credential = cert({
          projectId: this.env.FIREBASE_PROJECT_ID,
          clientEmail: this.env.FIREBASE_CLIENT_EMAIL,
          privateKey: this.env.FIREBASE_PRIVATE_KEY,
        });
      }
      this.app = initializeApp(options);
    }

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.ready = useEmulator || hasCert;

    if (!this.ready) {
      this.logger.warn(
        'Firebase credentials not set — auth/Firestore calls will fail until ' +
          'FIREBASE_* (or emulator) env vars are provided. Config-only endpoints still work.',
      );
    }
  }

  /** Verify a Firebase ID token from the Authorization header. */
  verifyIdToken(token: string) {
    return this.auth.verifyIdToken(token);
  }
}
