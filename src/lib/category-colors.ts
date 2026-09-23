/**
 * Mapeamento de categorias de vaga para classes CSS do badge colorido.
 * Os tokens --category-* são definidos em src/app/globals.css.
 */
export function getCategoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    'Full Stack':
      'bg-[hsl(var(--category-fullstack))]/10 text-[hsl(var(--category-fullstack))] border-[hsl(var(--category-fullstack))]/30',
    'Mobile':
      'bg-[hsl(var(--category-mobile))]/10 text-[hsl(var(--category-mobile))] border-[hsl(var(--category-mobile))]/30',
    'Backend':
      'bg-[hsl(var(--category-backend))]/10 text-[hsl(var(--category-backend))] border-[hsl(var(--category-backend))]/30',
    'Frontend':
      'bg-[hsl(var(--category-frontend))]/10 text-[hsl(var(--category-frontend))] border-[hsl(var(--category-frontend))]/30',
    'Data':
      'bg-[hsl(var(--category-data))]/10 text-[hsl(var(--category-data))] border-[hsl(var(--category-data))]/30',
    'DevOps':
      'bg-[hsl(var(--category-devops))]/10 text-[hsl(var(--category-devops))] border-[hsl(var(--category-devops))]/30',
    'IoT & Automação':
      'bg-[hsl(var(--category-iot))]/10 text-[hsl(var(--category-iot))] border-[hsl(var(--category-iot))]/30',
  };

  return (
    map[category] ??
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60'
  );
}
