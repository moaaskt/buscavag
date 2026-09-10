import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'resumes');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const resume = repo.getResume(session.userId);

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error('Error in GET /api/candidate/resume:', error);
    return NextResponse.json({ error: 'Erro ao buscar currículo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validação de extensão / tipo
    const originalName = file.name || 'curriculo.pdf';
    const ext = path.extname(originalName).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.doc'];

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo PDF (.pdf) ou Word (.docx, .doc)' },
        { status: 400 }
      );
    }

    // Validação de tamanho (máximo 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. O tamanho máximo permitido é 10MB' },
        { status: 400 }
      );
    }

    ensureUploadsDir();

    const fileId = crypto.randomUUID();
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskFilename = `${session.userId}_${Date.now()}_${sanitizedFilename}`;
    const filePath = path.join(UPLOADS_DIR, diskFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const repo = new CandidateRepository();
    
    // Se havia currículo anterior, tenta deletar arquivo antigo
    const oldResume = repo.getResume(session.userId);
    if (oldResume && oldResume.file_path && fs.existsSync(oldResume.file_path)) {
      try {
        fs.unlinkSync(oldResume.file_path);
      } catch (err) {
        console.warn('Could not delete old resume file:', err);
      }
    }

    const savedResume = repo.saveResume({
      id: fileId,
      user_id: session.userId,
      filename: originalName,
      file_path: filePath,
      file_size: file.size,
      file_type: ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return NextResponse.json({
      success: true,
      message: 'Currículo enviado com sucesso!',
      resume: savedResume,
    });
  } catch (error) {
    console.error('Error in POST /api/candidate/resume:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do currículo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const resume = repo.getResume(session.userId);

    if (resume) {
      if (resume.file_path && fs.existsSync(resume.file_path)) {
        try {
          fs.unlinkSync(resume.file_path);
        } catch (err) {
          console.warn('Could not delete resume file from disk:', err);
        }
      }
      repo.deleteResume(session.userId);
    }

    return NextResponse.json({ success: true, message: 'Currículo removido com sucesso' });
  } catch (error) {
    console.error('Error in DELETE /api/candidate/resume:', error);
    return NextResponse.json({ error: 'Erro ao excluir currículo' }, { status: 500 });
  }
}
