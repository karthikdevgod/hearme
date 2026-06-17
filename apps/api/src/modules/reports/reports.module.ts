import { Module } from '@nestjs/common';

/**
 * Reports module (Phase 3): generates a post-conversation report (summary,
 * mood, stress, topics, positives, challenges, reflection suggestions) plus the
 * mood-analysis engine. Gated by ENABLE_REPORTS / ENABLE_MOOD_ANALYSIS.
 */
@Module({})
export class ReportsModule {}
