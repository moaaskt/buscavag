import { db, initDatabase } from './index';
import { hashPassword } from '@/lib/auth';
import type { CandidateProfile, CandidateResume } from './candidateRepository';
import crypto from 'crypto';

export type UserAccountStatus = 'active' | 'suspended';

export interface AdminUserEntry {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'premium';
  role: 'CANDIDATE' | 'ADMIN' | 'GUEST';
  status: UserAccountStatus;
  onboarding_completed: number;
  force_password_change: number;
  created_at: string;
  updated_at: string;
  target_role?: string | null;
  seniority?: string | null;
  city?: string | null;
  state?: string | null;
  saved_jobs_count?: number;
}

export interface AdminUserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: 'all' | 'free' | 'premium';
  status?: 'all' | 'active' | 'suspended';
  role?: 'all' | 'CANDIDATE' | 'ADMIN';
}

export interface AdminUserStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  suspendedUsers: number;
  onboardedUsers: number;
}

export interface PaginatedAdminUsersResult {
  users: AdminUserEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: AdminUserStats;
}

export interface CandidateFullDetail {
  user: AdminUserEntry;
  profile: CandidateProfile | null;
  resumes: CandidateResume[];
  savedJobsCount: number;
  appliedJobsCount: number;
}

export class AdminUserRepository {
  constructor() {
    initDatabase();
  }

  public getAdminUsers(params: AdminUserFilterParams = {}): PaginatedAdminUsersResult {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(users.name) LIKE ? OR LOWER(users.email) LIKE ?)');
      queryParams.push(term, term);
    }

    if (params.tier && params.tier !== 'all') {
      whereClauses.push('users.tier = ?');
      queryParams.push(params.tier);
    }

    if (params.status && params.status !== 'all') {
      whereClauses.push('users.status = ?');
      queryParams.push(params.status);
    }

    if (params.role && params.role !== 'all') {
      whereClauses.push('users.role = ?');
      queryParams.push(params.role);
    }

    const whereSql = whereClauses.join(' AND ');

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM users WHERE ${whereSql}`);
    const { total } = countStmt.get(...queryParams) as { total: number };

    const dataStmt = db.prepare(`
      SELECT 
        users.id, users.email, users.name, users.tier, users.role,
        COALESCE(users.status, 'active') as status,
        users.onboarding_completed,
        COALESCE(users.force_password_change, 0) as force_password_change,
        users.created_at, users.updated_at,
        p.target_role, p.seniority, p.city, p.state,
        (SELECT COUNT(*) FROM user_saved_jobs s WHERE s.user_id = users.id) as saved_jobs_count
      FROM users
      LEFT JOIN candidate_profiles p ON users.id = p.user_id
      WHERE ${whereSql}
      ORDER BY users.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const users = dataStmt.all(...queryParams, limit, offset) as AdminUserEntry[];
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getAdminUserStats(): AdminUserStats {
    const row = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tier = 'premium' THEN 1 ELSE 0 END) as pro_count,
        SUM(CASE WHEN tier = 'free' OR tier IS NULL THEN 1 ELSE 0 END) as free_count,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_count,
        SUM(CASE WHEN onboarding_completed = 1 THEN 1 ELSE 0 END) as onboarded_count
      FROM users
    `).get() as {
      total: number;
      pro_count: number;
      free_count: number;
      suspended_count: number;
      onboarded_count: number;
    };

    return {
      totalUsers: row.total || 0,
      proUsers: row.pro_count || 0,
      freeUsers: row.free_count || 0,
      suspendedUsers: row.suspended_count || 0,
      onboardedUsers: row.onboarded_count || 0,
    };
  }

  public getUserDetail(userId: string): CandidateFullDetail | null {
    const userRow = db.prepare(`
      SELECT 
        users.id, users.email, users.name, users.tier, users.role,
        COALESCE(users.status, 'active') as status,
        users.onboarding_completed,
        COALESCE(users.force_password_change, 0) as force_password_change,
        users.created_at, users.updated_at
      FROM users
      WHERE users.id = ?
    `).get(userId) as AdminUserEntry | undefined;

    if (!userRow) return null;

    // Perfil de Candidato
    const profileRow = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(userId) as any;
    let profile: CandidateProfile | null = null;

    if (profileRow) {
      profile = {
        user_id: profileRow.user_id,
        target_role: profileRow.target_role || null,
        seniority: profileRow.seniority || null,
        expected_salary: profileRow.expected_salary || null,
        preferred_work_models: this.safeParseArray(profileRow.preferred_work_models),
        skills: this.safeParseArray(profileRow.skills),
        primary_stack: this.safeParseArray(profileRow.primary_stack),
        secondary_stack: this.safeParseArray(profileRow.secondary_stack),
        bio: profileRow.bio || null,
        city: profileRow.city || null,
        state: profileRow.state || null,
        updated_at: profileRow.updated_at,
      };
    }

    // Currículos anexados e análise de IA
    const resumeRows = db.prepare('SELECT * FROM candidate_resumes WHERE user_id = ? ORDER BY uploaded_at DESC').all(userId) as any[];
    const resumes: CandidateResume[] = resumeRows.map((r) => {
      let aiAnalysis = null;
      if (r.ai_analysis) {
        try {
          aiAnalysis = typeof r.ai_analysis === 'string' ? JSON.parse(r.ai_analysis) : r.ai_analysis;
        } catch {
          aiAnalysis = null;
        }
      }
      return {
        id: r.id,
        user_id: r.user_id,
        filename: r.filename,
        file_path: r.file_path,
        file_size: r.file_size,
        file_type: r.file_type,
        ai_analysis: aiAnalysis,
        analyzed_at: r.analyzed_at,
        uploaded_at: r.uploaded_at,
      };
    });

    // Contadores de engajamento no Kanban
    const savedCountRow = db.prepare('SELECT COUNT(*) as count FROM user_saved_jobs WHERE user_id = ?').get(userId) as { count: number };
    const appliedCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM user_saved_jobs 
      WHERE user_id = ? AND status IN ('applied', 'interview', 'offer')
    `).get(userId) as { count: number };

    return {
      user: userRow,
      profile,
      resumes,
      savedJobsCount: savedCountRow?.count || 0,
      appliedJobsCount: appliedCountRow?.count || 0,
    };
  }

  public updateUserTier(userId: string, tier: 'free' | 'premium'): boolean {
    const now = new Date().toISOString();
    const result = db.prepare('UPDATE users SET tier = ?, updated_at = ? WHERE id = ?').run(tier, now, userId);
    return result.changes > 0;
  }

  public toggleUserSuspension(userId: string): { id: string; previousStatus: UserAccountStatus; newStatus: UserAccountStatus } | null {
    const user = db.prepare('SELECT status FROM users WHERE id = ?').get(userId) as { status: UserAccountStatus } | undefined;
    if (!user) return null;

    const previousStatus: UserAccountStatus = user.status || 'active';
    const newStatus: UserAccountStatus = previousStatus === 'suspended' ? 'active' : 'suspended';
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, userId);

    return {
      id: userId,
      previousStatus,
      newStatus,
    };
  }

  public resetUserPassword(userId: string): { tempPassword: string; success: boolean } | null {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    // Senha temporária aleatória de 10 caracteres legíveis
    const tempPassword = `BV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const passwordHash = hashPassword(tempPassword);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, force_password_change = 1, updated_at = ? 
      WHERE id = ?
    `).run(passwordHash, now, userId);

    return {
      tempPassword,
      success: true,
    };
  }

  private safeParseArray(val: string | null | undefined): string[] {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
