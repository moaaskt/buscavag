import { z } from 'zod';
export var PlatformSource;
(function (PlatformSource) {
    PlatformSource["LINKEDIN"] = "linkedin";
    PlatformSource["INDEED"] = "indeed";
    PlatformSource["GUPY"] = "gupy";
    PlatformSource["GOOGLE_JOBS"] = "google_jobs";
    PlatformSource["TELEGRAM"] = "telegram";
    PlatformSource["PROGRAMATHOR"] = "programathor";
    PlatformSource["REMOTAR"] = "remotar";
    PlatformSource["CATHO"] = "catho";
    PlatformSource["GLASSDOOR"] = "glassdoor";
})(PlatformSource || (PlatformSource = {}));
export const RawJobSchema = z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    platform: z.nativeEnum(PlatformSource),
    url: z.string().url(),
    description: z.string(),
    publishedAt: z.date(),
    location: z.string().optional(),
});
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
    notified: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
});
