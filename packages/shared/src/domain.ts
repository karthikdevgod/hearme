import { z } from 'zod';
import { MESSAGE_ROLES, PLAN_IDS, USER_ROLES } from './constants';

/** ISO-8601 timestamp string (Firestore Timestamps are serialized to this over the wire). */
export const zIso = z.string();

// ── User ──
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().url().nullable(),
  role: z.enum(USER_ROLES),
  planId: z.enum(PLAN_IDS),
  onboardingComplete: z.boolean(),
  trialStartedAt: zIso.nullable(),
  createdAt: zIso,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserSettingsSchema = z.object({
  language: z.string(),
  voiceId: z.string().nullable(),
  conversationStyle: z.string().nullable(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// ── Voice ──
export const VoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  accent: z.string().nullable(),
  gender: z.string().nullable(),
  previewUrl: z.string().url().nullable(),
  labels: z.record(z.string()).optional(),
});
export type Voice = z.infer<typeof VoiceSchema>;

// ── Conversation ──
export const ConversationCostsSchema = z.object({
  sttCost: z.number(),
  llmCost: z.number(),
  ttsCost: z.number(),
  totalCost: z.number(),
});
export type ConversationCosts = z.infer<typeof ConversationCostsSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  language: z.string(),
  voiceId: z.string().nullable(),
  conversationStyle: z.string().nullable(),
  durationSeconds: z.number(),
  startedAt: zIso,
  endedAt: zIso.nullable(),
  costs: ConversationCostsSchema,
  audioPath: z.string().nullable(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(MESSAGE_ROLES),
  content: z.string(),
  timestamp: zIso,
});
export type Message = z.infer<typeof MessageSchema>;

// ── Memory ──
export const MemorySchema = z.object({
  userId: z.string(),
  goals: z.array(z.string()),
  interests: z.array(z.string()),
  recurringConcerns: z.array(z.string()),
  importantEvents: z.array(z.string()),
  updatedAt: zIso,
});
export type Memory = z.infer<typeof MemorySchema>;

// ── Mood / Report ──
export const MoodAnalysisSchema = z.object({
  overallMood: z.string(),
  stressScore: z.number().min(0).max(100),
  anxietyScore: z.number().min(0).max(100),
  positivityScore: z.number().min(0).max(100),
  topics: z.array(z.string()),
});
export type MoodAnalysis = z.infer<typeof MoodAnalysisSchema>;

export const ReportSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  userId: z.string(),
  summary: z.string(),
  mood: MoodAnalysisSchema,
  keyTopics: z.array(z.string()),
  positiveMoments: z.array(z.string()),
  challenges: z.array(z.string()),
  reflectionSuggestions: z.array(z.string()),
  createdAt: zIso,
});
export type Report = z.infer<typeof ReportSchema>;

// ── Plans / Billing ──
export const PlanSchema = z.object({
  id: z.enum(PLAN_IDS),
  name: z.string(),
  price: z.number(),
  minutes: z.number(),
  features: z.array(z.string()),
  stripePriceId: z.string().nullable(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const UsageSchema = z.object({
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD
  minutesUsed: z.number(),
  costs: ConversationCostsSchema,
});
export type Usage = z.infer<typeof UsageSchema>;

export const CreditLedgerEntrySchema = z.object({
  amount: z.number(),
  reason: z.string(),
  timestamp: zIso,
});
export const CreditsSchema = z.object({
  userId: z.string(),
  balance: z.number(),
  ledger: z.array(CreditLedgerEntrySchema),
});
export type Credits = z.infer<typeof CreditsSchema>;
