import { z } from 'zod';

/** Aggregated stats surfaced on the user dashboard. */
export const DashboardStatsSchema = z.object({
  totalConversations: z.number(),
  totalTalkTimeSeconds: z.number(),
  remainingMinutes: z.number(),
  planId: z.string(),
  moodScore: z.number(), // 0-100 rolling positivity
  weeklySummary: z.string(),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

/** Admin profitability + growth metrics. */
export const AdminMetricsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  revenue: z.number(),
  conversationMinutes: z.number(),
  aiCosts: z.number(),
  profit: z.number(),
  subscriptionCount: z.number(),
  trialConversionRate: z.number(),
});
export type AdminMetrics = z.infer<typeof AdminMetricsSchema>;
