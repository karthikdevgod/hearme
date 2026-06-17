import { Inject, Injectable } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { ServerEnv } from '@hearme/config';
import type { UserProfile, UserSettings } from '@hearme/shared';
import { ENV } from '../../common/config/config.module';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

export interface MeResponse extends UserProfile {
  settings: UserSettings | null;
}

/** User profile provisioning + reads on the `users` collection. */
@Injectable()
export class UsersService {
  constructor(
    @Inject(ENV) private readonly env: ServerEnv,
    private readonly firebase: FirebaseService,
  ) {}

  /** Return the user, creating the profile on first call (idempotent). */
  async getOrCreate(authUser: { uid: string; email?: string }): Promise<MeResponse> {
    const userRef = this.firebase.db.collection('users').doc(authUser.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      const profile: Omit<UserProfile, 'createdAt' | 'trialStartedAt'> & {
        createdAt: FieldValue;
        trialStartedAt: FieldValue;
      } = {
        uid: authUser.uid,
        email: authUser.email ?? null,
        displayName: null,
        photoURL: null,
        role: 'user',
        planId: 'free',
        onboardingComplete: false,
        createdAt: FieldValue.serverTimestamp(),
        trialStartedAt: FieldValue.serverTimestamp(),
      };
      await userRef.set(profile);
    }

    const fresh = (await userRef.get()).data() ?? {};
    const settingsSnap = await userRef.collection('settings').doc('preferences').get();

    return {
      uid: authUser.uid,
      email: fresh.email ?? authUser.email ?? null,
      displayName: fresh.displayName ?? null,
      photoURL: fresh.photoURL ?? null,
      role: fresh.role ?? 'user',
      planId: fresh.planId ?? 'free',
      onboardingComplete: fresh.onboardingComplete ?? false,
      trialStartedAt: this.toIso(fresh.trialStartedAt),
      createdAt: this.toIso(fresh.createdAt),
      settings: (settingsSnap.data() as UserSettings) ?? null,
    };
  }

  private toIso(value: unknown): string {
    if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    return new Date(0).toISOString();
  }
}
