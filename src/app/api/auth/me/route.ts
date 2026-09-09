import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const repo = new CandidateRepository();
    const user = repo.getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const profile = repo.getProfile(user.id);
    const resume = repo.getResume(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
      },
      profile,
      resume: resume ? {
        id: resume.id,
        filename: resume.filename,
        fileSize: resume.file_size,
        fileType: resume.file_type,
        uploadedAt: resume.uploaded_at,
      } : null,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ authenticated: false, error: 'Erro ao verificar sessão' }, { status: 500 });
  }
}
