import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

const profileSchema = z.object({
  target_role: z.string().max(100).optional().nullable(),
  seniority: z.string().max(50).optional().nullable(),
  expected_salary: z.string().max(50).optional().nullable(),
  preferred_work_models: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const profile = repo.getProfile(session.userId);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error in GET /api/candidate/profile:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const repo = new CandidateRepository();
    const updated = repo.upsertProfile(session.userId, parsed.data);

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error('Error in PUT /api/candidate/profile:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
