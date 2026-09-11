import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

const syncSchema = z.object({
  skills: z.array(z.string()).min(1, 'Pelo menos uma habilidade deve ser fornecida'),
  detectedRole: z.string().optional(),
  detectedSeniority: z.string().optional(),
  summary: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const repo = new CandidateRepository();
    const updatedProfile = repo.syncSkillsToProfile(
      session.userId,
      parsed.data.skills,
      parsed.data.detectedRole,
      parsed.data.detectedSeniority,
      parsed.data.summary
    );

    return NextResponse.json({
      success: true,
      message: `${parsed.data.skills.length} habilidades sincronizadas com o seu perfil com sucesso!`,
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error in POST /api/candidate/sync-skills:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar habilidades com o perfil' }, { status: 500 });
  }
}
