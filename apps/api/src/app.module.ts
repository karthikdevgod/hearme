import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { loadServerEnv } from '@hearme/config';

import { ConfigModule } from './common/config/config.module';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { OpenAIModule } from './infrastructure/openai/openai.module';
import { AnthropicModule } from './infrastructure/anthropic/anthropic.module';
import { ElevenLabsModule } from './infrastructure/elevenlabs/elevenlabs.module';
import { StripeModule } from './infrastructure/stripe/stripe.module';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { VoiceModule } from './modules/voice/voice.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MemoryModule } from './modules/memory/memory.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BillingModule } from './modules/billing/billing.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

const env = loadServerEnv(process.env);

@Module({
  imports: [
    // Infrastructure (global)
    ConfigModule,
    FirebaseModule,
    OpenAIModule,
    AnthropicModule,
    ElevenLabsModule,
    StripeModule,
    ThrottlerModule.forRoot([{ ttl: env.RATE_LIMIT_TTL * 1000, limit: env.RATE_LIMIT_MAX }]),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    OnboardingModule,
    VoiceModule,
    ConversationsModule,
    MemoryModule,
    ReportsModule,
    BillingModule,
    DashboardModule,
    AdminModule,
    AnalyticsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
