import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { JobRepository } from '@/db/repository';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = whatsappService.getStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipient, message, jobId, includeCoverLetter, candidateName, force } = body;

    const session = await getSessionUser(request);

    // 1. Prévia de Carta de Apresentação
    if (type === 'preview-cover-letter') {
      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'O parâmetro jobId é obrigatório para gerar a prévia.' },
          { status: 400 }
        );
      }

      const repo = new JobRepository();
      const job = repo.getJobById(jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Vaga não encontrada.' },
          { status: 404 }
        );
      }

      const name = candidateName || session?.name || 'Moacir Neto';
      const coverLetter = whatsappService.generateCoverLetter({
        title: job.title,
        company: job.company,
        description: job.description,
        gaps: job.gaps,
      }, name);

      const formattedAlert = whatsappService.formatJobAlert(job, true, name);

      return NextResponse.json({
        success: true,
        coverLetter,
        formattedAlert,
      });
    }

    // 2. Disparo de Mensagem de Teste
    if (type === 'test') {
      const testText = message || '🚀 *Teste de Notificação Buscavag:* Integração com WhatsApp ativa e funcionando perfeitamente!';
      const result = await whatsappService.sendMessage(recipient, testText);

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // 3. Disparo de Notificação de Vaga Específica
    if (type === 'job') {
      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'O parâmetro jobId é obrigatório.' },
          { status: 400 }
        );
      }

      const repo = new JobRepository();
      const job = repo.getJobById(jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Vaga não encontrada.' },
          { status: 404 }
        );
      }

      const name = candidateName || session?.name || 'Moacir Neto';
      const result = await whatsappService.sendJobNotification(job, recipient, {
        force: force ?? true, // Em disparo manual via API, default é permitir forçar
        includeCoverLetter: includeCoverLetter ?? false,
        candidateName: name,
      });

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Tipo de requisição inválido. Utilize 'test', 'job' ou 'preview-cover-letter'.",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
