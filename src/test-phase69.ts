import { generatePitch, PitchCandidateContext } from './lib/pitchGenerator';
import { PlatformSource, ProcessedJob } from './types/job';
import assert from 'node:assert';

async function runPhase69Tests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TESTES DA PHASE 69: GERADOR DE PITCH DINÂMICO & MULTI-TENANT');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // CENÁRIO 1: Perfil Completo (target_role + primary_stack + name) em ATS Tradicional
  // ----------------------------------------------------
  console.log('[TESTE 1] Perfil Completo em Vaga Tradicional (Gupy/Indeed)...');
  const jobAts: Partial<ProcessedJob> = {
    title: 'Engenheiro de Software Backend',
    company: 'Fintech Nexus',
    platform: PlatformSource.GUPY,
    url: 'https://gupy.io/job-123',
  };

  const candidateComplete: PitchCandidateContext = {
    name: 'Moacir Neto',
    targetRole: 'Desenvolvedor Backend Pleno',
    primaryStack: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    skills: ['Git', 'Linux', 'AWS'],
  };

  const pitch1 = generatePitch(jobAts as ProcessedJob, candidateComplete);
  console.log('--- Pitch Gerado (Cenário 1) ---');
  console.log(pitch1);
  console.log('--------------------------------');

  assert.ok(pitch1.includes('time de recrutamento da Fintech Nexus'), 'Deve saudar o time de recrutamento');
  assert.ok(pitch1.includes('Atuo como Desenvolvedor Backend Pleno'), 'Deve usar o targetRole real');
  assert.ok(pitch1.includes('Python, FastAPI, PostgreSQL e Docker'), 'Deve conter as tecnologias da primary_stack');
  assert.ok(pitch1.includes('Atenciosamente,\nMoacir Neto'), 'Deve assinar com o nome do candidato');
  console.log('✓ Cenário 1 aprovado: Perfil completo respeitado integralmente.\n');

  // ----------------------------------------------------
  // CENÁRIO 2: Perfil sem primary_stack, com fallback para skills
  // ----------------------------------------------------
  console.log('[TESTE 2] Fallback para skills (quando primary_stack está vazia)...');
  const candidateSkillsOnly: PitchCandidateContext = {
    name: 'Ana Souza',
    targetRole: 'Desenvolvedora Mobile',
    primaryStack: [], // Vazia
    skills: ['Flutter', 'Dart', 'Firebase'],
  };

  const pitch2 = generatePitch(jobAts as ProcessedJob, candidateSkillsOnly);
  console.log('--- Pitch Gerado (Cenário 2) ---');
  console.log(pitch2);
  console.log('--------------------------------');

  assert.ok(pitch2.includes('Atuo como Desenvolvedora Mobile'), 'Deve usar o cargo pretendido');
  assert.ok(pitch2.includes('Flutter, Dart e Firebase'), 'Deve fazer fallback e listar as skills reais');
  assert.ok(pitch2.includes('Atenciosamente,\nAna Souza'), 'Deve assinar com Ana Souza');
  console.log('✓ Cenário 2 aprovado: Fallback para skills aplicado com sucesso.\n');

  // ----------------------------------------------------
  // CENÁRIO 3: Fallback Elegante sem Stacks (REQ-06) - ANTI-ALUCINAÇÃO
  // ----------------------------------------------------
  console.log('[TESTE 3] Fallback Elegante sem Stacks (Garantia Estrita Anti-Alucinação)...');
  const candidateNoTech: PitchCandidateContext = {
    name: 'Carlos Oliveira',
    targetRole: 'Tech Lead',
    primaryStack: [],
    skills: [],
  };

  const pitch3 = generatePitch(jobAts as ProcessedJob, candidateNoTech);
  console.log('--- Pitch Gerado (Cenário 3) ---');
  console.log(pitch3);
  console.log('--------------------------------');

  assert.ok(pitch3.includes('Atuo como Tech Lead'), 'Deve citar o cargo pretendido');
  assert.ok(pitch3.includes('sólida vivência na arquitetura de aplicações'), 'Deve usar redação profissional neutra');

  // Validação estrita: NÃO pode conter tecnologias aleatórias que o usuário não cadastrou
  const forbiddenKeywords = ['TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'Java', 'PHP'];
  for (const tech of forbiddenKeywords) {
    assert.strictEqual(
      pitch3.includes(tech),
      false,
      `Pitch NÃO PODE conter a tecnologia alucinada "${tech}" quando o perfil não a possui!`
    );
  }
  console.log('✓ Cenário 3 aprovado: Nenhuma tecnologia inventada no fallback elegante.\n');

  // ----------------------------------------------------
  // CENÁRIO 4: Vaga informal de Feed do LinkedIn (linkedin_posts)
  // ----------------------------------------------------
  console.log('[TESTE 4] Vaga originada de Post do LinkedIn (linkedin_posts)...');
  const jobLinkedinPost: Partial<ProcessedJob> = {
    title: 'Desenvolvedor Frontend Vue.js',
    company: 'Startup Inovadora',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: 'https://linkedin.com/feed/update/urn:li:activity:789',
  };

  const pitch4 = generatePitch(jobLinkedinPost as ProcessedJob, {
    targetRole: 'Desenvolvedor Frontend',
    primaryStack: ['Vue.js', 'TypeScript', 'TailwindCSS'],
  });
  console.log('--- Pitch Gerado (Cenário 4) ---');
  console.log(pitch4);
  console.log('--------------------------------');

  assert.ok(pitch4.includes('Vi sua publicação no LinkedIn referente à oportunidade de Desenvolvedor Frontend Vue.js'), 'Deve saudar o post no LinkedIn');
  assert.ok(!pitch4.includes('time de recrutamento'), 'Não deve usar a saudação burocrática de recrutamento');
  assert.ok(pitch4.includes('Vue.js, TypeScript e TailwindCSS'), 'Deve conter as tecnologias reais');
  console.log('✓ Cenário 4 aprovado: Abertura para LinkedIn Feed contextualizada.\n');

  // ----------------------------------------------------
  // CENÁRIO 5: Vaga informal de Comunidade do Facebook (facebook_groups)
  // ----------------------------------------------------
  console.log('[TESTE 5] Vaga originada de Comunidade do Facebook (facebook_groups)...');
  const jobFacebook: Partial<ProcessedJob> = {
    title: 'Programador PHP Laravel',
    company: 'Agência Digital',
    platform: PlatformSource.FACEBOOK_GROUPS,
    url: 'https://facebook.com/groups/jobs/permalink/456',
  };

  const pitch5 = generatePitch(jobFacebook as ProcessedJob, {
    targetRole: 'Desenvolvedor Full Stack',
    primaryStack: ['PHP', 'Laravel', 'MySQL'],
  });
  console.log('--- Pitch Gerado (Cenário 5) ---');
  console.log(pitch5);
  console.log('--------------------------------');

  assert.ok(pitch5.includes('Vi sua postagem na comunidade referente à oportunidade de Programador PHP Laravel'), 'Deve saudar o post de comunidade');
  assert.ok(pitch5.includes('PHP, Laravel e MySQL'), 'Deve listar as stacks do candidato');
  console.log('✓ Cenário 5 aprovado: Abertura para comunidades Facebook contextualizada.\n');

  // ----------------------------------------------------
  // CENÁRIO 6: Vaga com Contato Direto (directContact)
  // ----------------------------------------------------
  console.log('[TESTE 6] Vaga com Contato Direto (e-mail extraído pelo Hermes)...');
  const jobDirect: Partial<ProcessedJob> = {
    title: 'Engenheiro de Dados Sênior',
    company: 'Data Analytics Co',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: 'https://linkedin.com/posts/xyz',
    directContact: 'talentos@dataanalyticsco.com',
  };

  const pitch6 = generatePitch(jobDirect as ProcessedJob, {
    name: 'Juliana Lima',
    targetRole: 'Engenheira de Dados',
    primaryStack: ['Python', 'SQL', 'Airflow', 'BigQuery'],
  });
  console.log('--- Pitch Gerado (Cenário 6) ---');
  console.log(pitch6);
  console.log('--------------------------------');

  assert.ok(pitch6.includes('estou encaminhando minha apresentação diretamente conforme indicado'), 'Deve usar saudação de contato direto');
  assert.ok(pitch6.includes('Contato direto: talentos@dataanalyticsco.com'), 'Deve incluir o e-mail de contato direto no rodapé');
  assert.ok(pitch6.includes('Python, SQL, Airflow e BigQuery'), 'Deve citar as stacks reais');
  console.log('✓ Cenário 6 aprovado: Contato direto preservado e destacado com sucesso.\n');

  // ----------------------------------------------------
  // CENÁRIO 7: Visitante Anônimo (Contexto Nulo / Undefined)
  // ----------------------------------------------------
  console.log('[TESTE 7] Visitante Anônimo (sem sessão ou perfil logado)...');
  const pitch7 = generatePitch(jobAts as ProcessedJob, null);
  console.log('--- Pitch Gerado (Cenário 7) ---');
  console.log(pitch7);
  console.log('--------------------------------');

  assert.ok(pitch7.includes('time de recrutamento da Fintech Nexus'), 'Deve saudar o time de recrutamento');
  assert.ok(pitch7.includes('Tenho forte interesse em atuar na posição de Engenheiro de Software Backend'), 'Deve contextualizar com o cargo da vaga');
  assert.ok(pitch7.includes('sólida vivência na arquitetura de aplicações'), 'Deve usar fallback neutro');
  assert.ok(!pitch7.includes('undefined'), 'NÃO PODE conter "undefined" no texto');
  assert.ok(!pitch7.includes('null'), 'NÃO PODE conter "null" no texto');
  console.log('✓ Cenário 7 aprovado: Resiliência total para visitante anônimo.\n');

  // ----------------------------------------------------
  // CENÁRIO 8: Caracteres Especiais e Títulos com C++ e .NET
  // ----------------------------------------------------
  console.log('[TESTE 8] Tecnologias e Títulos com Caracteres Especiais (C++, .NET, C#)...');
  const jobSpecial: Partial<ProcessedJob> = {
    title: 'Desenvolvedor C++ / .NET Core',
    company: 'Embedded & Games Studio',
    platform: PlatformSource.PROGRAMATHOR,
    url: 'https://programathor.com.br/jobs/999',
  };

  const pitch8 = generatePitch(jobSpecial as ProcessedJob, {
    targetRole: 'Engenheiro de Software C++',
    primaryStack: ['C++', 'C#', '.NET Core', 'Unreal Engine'],
  });
  console.log('--- Pitch Gerado (Cenário 8) ---');
  console.log(pitch8);
  console.log('--------------------------------');

  assert.ok(pitch8.includes('C++, C#, .NET Core e Unreal Engine'), 'Deve formatar caracteres especiais sem corrupção');
  assert.ok(pitch8.includes('Engenheiro de Software C++'), 'Deve incluir o cargo com símbolos');
  console.log('✓ Cenário 8 aprovado: Caracteres especiais tratados perfeitamente.\n');

  console.log('====================================================');
  console.log('🎉 TODOS OS 8 CENÁRIOS DA PHASE 69 PASSARAM COM SUCESSO!');
  console.log('====================================================\n');
}

runPhase69Tests().catch((err) => {
  console.error('❌ ERRO NA EXECUÇÃO DOS TESTES DA PHASE 69:', err);
  process.exit(1);
});
