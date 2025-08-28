import { z } from 'zod';

// Week schema for learning plan
export const WeekSchema = z.object({
  week: z.number().int().min(1).max(4),
  topics: z.array(z.string()).min(1).max(10),
  practice: z.array(z.string()).min(1).max(8),
  assessment: z.string().min(3).max(200),
  project: z.string().min(3).max(200)
});

// Complete learning plan schema
export const PlanSchema = z.object({
  weeks: z.array(WeekSchema).length(4)
});

// Individual recommendation item schema
export const RecommendationItemSchema = z.object({
  roleId: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  fitScore: z.number().min(0).max(100),
  why: z.string().min(10).max(600),
  overlapSkills: z.array(z.string()).max(20),
  gapSkills: z.array(z.string()).max(20),
  plan: PlanSchema
});

// Complete recommendation response schema
export const RecommendationResponseSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).length(3)
});

// User profile schema
export const UserProfileSchema = z.object({
  name: z.string().min(1).max(80),
  education: z.string().min(1).max(40),
  skills: z.array(z.string()).min(1).max(50),
  interests: z.array(z.string()).min(1).max(20),
  weeklyTime: z.number().int().min(1).max(30),
  budget: z.enum(['free', 'low', 'any']),
  language: z.enum(['en', 'hi'])
});

// Firestore document schemas
export const ProfileDocumentSchema = z.object({
  ...UserProfileSchema.shape,
  updatedAt: z.any() // Firestore timestamp
});

export const RecommendationDocumentSchema = z.object({
  createdAt: z.any(), // Firestore timestamp
  inputProfileSnapshot: UserProfileSchema,
  top3Recommendations: z.array(RecommendationItemSchema).length(3),
  modelVersion: z.string()
});
