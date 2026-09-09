import { db, initDatabase } from './index.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: 'free' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  user_id: string;
  target_role: string | null;
  seniority: string | null;
  expected_salary: string | null;
  preferred_work_models: string[];
  skills: string[];
  bio: string | null;
  updated_at: string;
}

export interface CandidateResume {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface SavedJobRecord {
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

export class CandidateRepository {
  constructor() {
    initDatabase();
  }

  // --- Usuários ---

  createUser(user: { id: string; email: string; password_hash: string; name: string; tier?: 'free' | 'premium' }): User {
    const now = new Date().toISOString();
    const tier = user.tier || 'free';

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(user.id, user.email.toLowerCase().trim(), user.password_hash, user.name.trim(), tier, now, now);

    // Inicializa perfil vazio
    const profileStmt = db.prepare(`
      INSERT OR IGNORE INTO candidate_profiles (user_id, target_role, seniority, expected_salary, preferred_work_models, skills, bio, updated_at)
      VALUES (?, '', 'Júnior', '', '[]', '[]', '', ?)
    `);
    profileStmt.run(user.id, now);

    return {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      password_hash: user.password_hash,
      name: user.name.trim(),
      tier,
      created_at: now,
      updated_at: now,
    };
  }

  getUserByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email.toLowerCase().trim()) as User | undefined;
    return row || null;
  }

  getUserById(id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as User | undefined;
    return row || null;
  }

  updateUserTier(id: string, tier: 'free' | 'premium'): boolean {
    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE users SET tier = ?, updated_at = ? WHERE id = ?');
    const info = stmt.run(tier, now, id);
    return info.changes > 0;
  }

  // --- Perfil do Candidato ---

  getProfile(userId: string): CandidateProfile | null {
    const stmt = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?');
    const row = stmt.get(userId) as any;
    if (!row) return null;

    let workModels: string[] = [];
    let skills: string[] = [];
    try {
      workModels = JSON.parse(row.preferred_work_models || '[]');
    } catch {
      workModels = [];
    }
    try {
      skills = JSON.parse(row.skills || '[]');
    } catch {
      skills = [];
    }

    return {
      user_id: row.user_id,
      target_role: row.target_role || null,
      seniority: row.seniority || 'Júnior',
      expected_salary: row.expected_salary || null,
      preferred_work_models: workModels,
      skills,
      bio: row.bio || null,
      updated_at: row.updated_at,
    };
  }

  upsertProfile(userId: string, data: Partial<CandidateProfile>): CandidateProfile {
    const now = new Date().toISOString();
    const existing = this.getProfile(userId);

    const target_role = data.target_role !== undefined ? data.target_role : existing?.target_role || '';
    const seniority = data.seniority !== undefined ? data.seniority : existing?.seniority || 'Júnior';
    const expected_salary = data.expected_salary !== undefined ? data.expected_salary : existing?.expected_salary || '';
    const preferred_work_models = JSON.stringify(data.preferred_work_models || existing?.preferred_work_models || []);
    const skills = JSON.stringify(data.skills || existing?.skills || []);
    const bio = data.bio !== undefined ? data.bio : existing?.bio || '';

    const stmt = db.prepare(`
      INSERT INTO candidate_profiles (user_id, target_role, seniority, expected_salary, preferred_work_models, skills, bio, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        target_role = excluded.target_role,
        seniority = excluded.seniority,
        expected_salary = excluded.expected_salary,
        preferred_work_models = excluded.preferred_work_models,
        skills = excluded.skills,
        bio = excluded.bio,
        updated_at = excluded.updated_at
    `);

    stmt.run(userId, target_role, seniority, expected_salary, preferred_work_models, skills, bio, now);

    return this.getProfile(userId)!;
  }

  // --- Currículo ---

  saveResume(resume: { id: string; user_id: string; filename: string; file_path: string; file_size: number; file_type: string }): CandidateResume {
    const now = new Date().toISOString();

    // Remove qualquer currículo anterior do mesmo usuário para manter o mais recente
    db.prepare('DELETE FROM candidate_resumes WHERE user_id = ?').run(resume.user_id);

    const stmt = db.prepare(`
      INSERT INTO candidate_resumes (id, user_id, filename, file_path, file_size, file_type, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(resume.id, resume.user_id, resume.filename, resume.file_path, resume.file_size, resume.file_type, now);

    return {
      ...resume,
      uploaded_at: now,
    };
  }

  getResume(userId: string): CandidateResume | null {
    const stmt = db.prepare('SELECT * FROM candidate_resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1');
    const row = stmt.get(userId) as CandidateResume | undefined;
    return row || null;
  }

  deleteResume(userId: string): boolean {
    const stmt = db.prepare('DELETE FROM candidate_resumes WHERE user_id = ?');
    const info = stmt.run(userId);
    return info.changes > 0;
  }

  // --- Vagas Salvas & Candidaturas ---

  toggleSavedJob(userId: string, jobId: string, status: string = 'saved'): { isSaved: boolean; status: string } {
    const checkStmt = db.prepare('SELECT status FROM user_saved_jobs WHERE user_id = ? AND job_id = ?');
    const existing = checkStmt.get(userId, jobId) as { status: string } | undefined;

    if (existing) {
      if (existing.status === status) {
        // Remove
        db.prepare('DELETE FROM user_saved_jobs WHERE user_id = ? AND job_id = ?').run(userId, jobId);
        return { isSaved: false, status: '' };
      } else {
        // Atualiza status (ex: de saved para applied)
        db.prepare('UPDATE user_saved_jobs SET status = ? WHERE user_id = ? AND job_id = ?').run(status, userId, jobId);
        return { isSaved: true, status };
      }
    } else {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO user_saved_jobs (user_id, job_id, status, created_at) VALUES (?, ?, ?, ?)').run(
        userId,
        jobId,
        status,
        now
      );
      return { isSaved: true, status };
    }
  }

  getSavedJobs(userId: string): SavedJobRecord[] {
    const stmt = db.prepare(`
      SELECT 
        s.user_id,
        s.job_id,
        s.status,
        s.created_at as saved_at,
        j.id as j_id,
        j.title as j_title,
        j.company as j_company,
        j.location as j_location,
        j.url as j_url,
        j.platform as j_platform,
        j.published_at as j_published_at,
        j.score_ia as j_score_ia,
        j.overall_score as j_overall_score
      FROM user_saved_jobs s
      JOIN jobs j ON s.job_id = j.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `);

    const rows = stmt.all(userId) as any[];

    return rows.map((r) => ({
      user_id: r.user_id,
      job_id: r.job_id,
      status: r.status,
      saved_at: r.saved_at,
      job: {
        id: r.j_id,
        title: r.j_title,
        company: r.j_company,
        location: r.j_location,
        url: r.j_url,
        platform: r.j_platform,
        published_at: r.j_published_at,
        score_ia: r.j_score_ia || 0,
        overall_score: r.j_overall_score || 0,
      },
    }));
  }
}
