import { Module } from '@nestjs/common';

/**
 * Memory module (Phase 3): extracts long-term memory (goals, interests,
 * recurring concerns, important events) from completed conversations. Only
 * meaningful items are stored, gated by ENABLE_MEMORY.
 */
@Module({})
export class MemoryModule {}
