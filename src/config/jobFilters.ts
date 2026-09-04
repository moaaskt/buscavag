export const TITLE_BLACKLIST: string[] = [
  'pedreiro',
  'motorista',
  'vigilante',
  'mecânico',
  'mecanico',
  'musculação',
  'musculacao',
  'serviços gerais',
  'servicos gerais',
  'atendente',
  'vendedor',
  'fiscal de',
  'limpeza',
  'cozinheiro',
  'recepcionista',
  'porteiro',
  'balconista',
  'operador de',
  'auxiliar de limpeza',
  'faxineiro',
  'jardineiro',
  'zelador',
  'segurança',
  'seguranca',
  'garçom',
  'garcom',
  'esteticista',
  'manicure',
  'barbeiro',
  'cuidador',
  'diarista',
];

export const TECH_WHITELIST: string[] = [
  'desenvolvedor',
  'developer',
  'programador',
  'engineer',
  'engenheiro',
  'frontend',
  'backend',
  'fullstack',
  'full stack',
  'mobile',
  'data',
  'dados',
  'software',
  'tech',
  'qa',
  'devops',
  'iot',
  'web',
  'sistema',
  'analista de sistemas',
  'ti ',
  'ti/',
  'ti-',
  'tecnologia da informação',
  'tecnologia da informacao',
  'suporte técnico',
  'suporte tecnico',
  'infraestrutura',
];

/**
 * Verifica se um título contém algum termo da blacklist.
 */
export function matchesBlacklist(title: string): { matched: boolean; term?: string } {
  if (!title) return { matched: false };
  const normalizedTitle = title.toLowerCase();
  for (const term of TITLE_BLACKLIST) {
    if (normalizedTitle.includes(term.toLowerCase())) {
      return { matched: true, term };
    }
  }
  return { matched: false };
}

/**
 * Verifica se um título contém algum termo da whitelist técnica.
 */
export function matchesWhitelist(title: string): { matched: boolean; term?: string } {
  if (!title) return { matched: false };
  const normalizedTitle = title.toLowerCase();
  for (const term of TECH_WHITELIST) {
    if (normalizedTitle.includes(term.toLowerCase())) {
      return { matched: true, term };
    }
  }
  return { matched: false };
}

/**
 * Verifica se um título de vaga é considerado técnico de acordo com a blacklist e whitelist.
 */
export function isTechJob(title: string): boolean {
  if (matchesBlacklist(title).matched) {
    return false;
  }
  return matchesWhitelist(title).matched;
}
