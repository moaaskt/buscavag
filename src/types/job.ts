import { z } from 'zod';

export enum PlatformSource {
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  GUPY = 'gupy',
  GOOGLE_JOBS = 'google_jobs',
  TELEGRAM = 'telegram',
  PROGRAMATHOR = 'programathor',
  REMOTAR = 'remotar',
  CATHO = 'catho',
  GLASSDOOR = 'glassdoor',
}

export const RawJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  platform: z.nativeEnum(PlatformSource),
  url: z.string().url(),
  description: z.string(),
  publishedAt: z.date(),
  location: z.string().optional(),
});

export type RawJob = z.infer<typeof RawJobSchema>;

export const ProcessedJobSchema = RawJobSchema.extend({
  id: z.string(),
  isJuniorFullStack: z.boolean(),
  scoreIa: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  stackScore: z.number().min(0).max(100).optional(),
  seniorityScore: z.number().min(0).max(100).optional(),
  locationScore: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
  gaps: z.array(z.string()).optional(),
  resumeTips: z.string().optional(),
  aiReasoning: z.string().optional(),
  applicationStatus: z.enum(['pending', 'applied', 'interview', 'offer', 'rejected']).default('pending').optional(),
  notified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type ProcessedJob = z.infer<typeof ProcessedJobSchema>;
