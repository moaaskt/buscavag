# REQUIREMENTS - v12.0: Polimento UI/UX, Total Multi-tenancy, Scraper Stream & Zero-State DB

## 1. Isolamento Multi-tenant do Kanban (/board)
- **Status:** Atualmente o `/board` lê da tabela global `jobs` misturando o status de candidatura de todos.
- **Objetivo:** O kanban deve ser isolado por candidato (`userId`).
- **Comportamento Esperado:**
  - O board de um novo candidato começa vazio (0 vagas).
  - Vagas entram no Kanban apenas se o usuário as salvar / candidatar (inseridas na tabela `user_saved_jobs`).
  - O Drag and Drop atualizará o campo `status` da tabela `user_saved_jobs` para aquele usuário específico.

## 2. Enforcement do Paywall Free na Análise de CV
- **Status:** A rota `/api/candidate/analyze-cv` não limita a quantidade de análises por usuário Free.
- **Objetivo:** Restringir a re-análise com IA a usuários Premium.
- **Comportamento Esperado:**
  - Usuários Free (tier === 'free') podem analisar o currículo apenas a primeira vez.
  - Se um usuário Free tentar analisar novamente, a API retornará `HTTP 403 Forbidden` com uma mensagem de Upsell.
  - Na UI, o botão "Reanalisar com IA" se transformará em um CTA de "Upgrade Pro" para o plano Free caso ele já possua uma análise.

## 3. Sincronização do Resumo Executivo para a Bio
- **Status:** O botão "Sincronizar Skills com Perfil" sincroniza apenas roles, senioridade e hard skills.
- **Objetivo:** Persistir também o Resumo Executivo da IA na Bio do candidato.
- **Comportamento Esperado:**
  - A rota `/api/candidate/sync-skills` deve ser adaptada para aceitar o campo `summary` e atualizar a coluna `bio` na tabela `candidate_profiles`.
  - A interface de Perfil do Candidato deve refletir a nova Bio instantaneamente após a sincronização.

## 4. Scraper Stream & Visual Polishing
- **Status:** Interface de scrapers e logs precisa de feedback visual robusto e suporte a banco de dados em estado inicial (zero-state DB).
- **Objetivo:** Garantir que o streaming de execução dos scrapers e exibição de dados operem perfeitamente sem falhas visuais.
