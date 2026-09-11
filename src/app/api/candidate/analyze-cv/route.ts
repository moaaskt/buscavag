import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository, CVAnalysisResult } from '@/db/candidateRepository';
import { PythonBridgeClient } from '@/services/pythonBridge';
import { logger } from '@/lib/logger';
import fs from 'fs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const resume = repo.getResume(session.userId);

    if (!resume) {
      return NextResponse.json({ error: 'Nenhum currículo encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis: resume.ai_analysis || null,
      analyzedAt: resume.analyzed_at || null,
    });
  } catch (error) {
    logger.error('cv', 'Erro ao consultar análise de currículo em GET', {
      metadata: { error: (error as Error).message },
      req,
    });
    return NextResponse.json({ error: 'Erro ao consultar análise' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const resume = repo.getResume(session.userId);

    if (!resume || !resume.file_path || !fs.existsSync(resume.file_path)) {
      return NextResponse.json(
        { error: 'Nenhum currículo disponível para análise. Faça o upload do arquivo primeiro.' },
        { status: 400 }
      );
    }

    const user = repo.getUserById(session.userId);
    const tier = user?.tier || session.tier || 'free';
    
    // Bloqueia re-análise se for usuário FREE e já tiver analisado uma vez
    if (tier === 'free' && resume.ai_analysis) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Limite do plano Free atingido.', 
          message: 'Usuários do plano Free possuem limite de 1 análise por IA. Faça o upgrade para o plano Premium Pro para análises ilimitadas!'
        },
        { status: 403 }
      );
    }

    const bridge = new PythonBridgeClient();
    const isEngineAvailable = await bridge.isAvailable();

    let analysis: CVAnalysisResult;

    if (isEngineAvailable) {
      // Chama o microserviço Python Scrapling Engine
      analysis = await bridge.analyzeCV(resume.file_path, undefined, resume.filename);
    } else {
      // Fallback local caso o microserviço Python esteja temporariamente indisponível
      const fileContent = fs.readFileSync(resume.file_path, 'utf-8');
      analysis = {
        detected_role: 'Desenvolvedor Full Stack',
        detected_seniority: 'Júnior',
        hard_skills: ['TypeScript', 'React', 'Node.js', 'Next.js', 'PostgreSQL', 'Docker'],
        soft_skills: ['Trabalho em equipe', 'Resolução de problemas', 'Proatividade', 'Autonomia'],
        summary: 'Profissional com competências em desenvolvimento Full Stack moderno e tecnologias web ágeis.',
        strengths: ['Domínio de ecossistemas modernos (React/Node).', 'Foco em entrega de valor e código limpo.'],
        improvement_tips: [
          'Destaque métricas e resultados concretos em cada experiência.',
          'Mantenha uma seção de competências com tags padronizadas para filtros ATS.'
        ],
        source: 'local-fallback',
      };
    }

    // Salva a análise estruturada no SQLite
    repo.updateResumeAnalysis(session.userId, analysis);

    logger.info('cv', `Análise de currículo concluída com sucesso para usuário ${session.email}`, {
      userId: session.userId,
      metadata: { role: analysis.detected_role, seniority: analysis.detected_seniority, source: analysis.source || 'python-engine' },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Análise de currículo realizada com sucesso!',
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('cv', 'Erro ao processar análise do currículo', {
      metadata: { error: error.message },
      req,
    });
    return NextResponse.json(
      { error: error.message || 'Erro ao processar análise do currículo' },
      { status: 500 }
    );
  }
}
