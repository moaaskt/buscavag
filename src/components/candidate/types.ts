import { ProcessedJob } from '@/types/job';

export interface UserData {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'premium';
}

export interface ProfileData {
  target_role: string | null;
  seniority: string | null;
  expected_salary: string | null;
  preferred_work_models: string[];
  skills: string[];
  bio: string | null;
  city: string | null;
  state: string | null;
}

export interface CVAnalysisData {
  detected_role: string;
  detected_seniority: string;
  hard_skills: string[];
  soft_skills: string[];
  primary_stack?: string[];
  secondary_stack?: string[];
  summary: string;
  strengths: string[];
  improvement_tips: string[];
  source?: string;
}

export interface ResumeData {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  ai_analysis?: CVAnalysisData | null;
  analyzedAt?: string | null;
}

export interface RecommendedJobItem {
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    platform: string;
    published_at: string;
    description: string;
  };
  match: {
    jobId: string;
    overallScore: number;
    stackScore: number;
    roleScore: number;
    seniorityScore: number;
    locationScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchReasoning: string;
    isStrongMatch: boolean;
  };
  isSaved: boolean;
  isLocked?: boolean;
}

export interface MatchStatsData {
  totalAnalyzed: number;
  avgScore: number;
  highMatchCount: number;
  moderateMatchCount: number;
  topMatchedSkills: Array<{ skill: string; count: number }>;
}

export interface SavedJob {
  user_id: string;
  job_id: string;
  status: string;
  saved_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    platform: string;
    published_at: string;
    score_ia: number;
    overall_score: number;
  };
}

export type TabType = 'recommended' | 'profile' | 'resume' | 'saved';
