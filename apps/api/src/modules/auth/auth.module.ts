import { Module } from '@nestjs/common';

/**
 * Auth module (Phase 1). Firebase Auth handles the actual sign-in on the client
 * (Google / Email OTP / Phone behind flag). The api verifies ID tokens via
 * FirebaseAuthGuard and provisions the user profile on first request.
 */
@Module({})
export class AuthModule {}
