import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

const VALID_UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
                   'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'] as const;

const profileSchema = z.object({
  target_role: z.string().max(100).optional().nullable(),
  seniority: z.string().max(50).optional().nullable(),
  expected_salary: z.string().max(50).optional().nullable(),
  preferred_work_models: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional().nullable(),
  city: z.string().max(100).optional().nullable()
    .transform((v) => v?.trim() || null), // I-04: sanitiza espaços antes de persistir
  state: z.enum(VALID_UFS).optional().nullable(),
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
    const onboardingCompleted = repo.isOnboardingComplete(session.userId);

    return NextResponse.json({ success: true, profile: updated, onboardingCompleted });
  } catch (error) {
    console.error('Error in PUT /api/candidate/profile:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
