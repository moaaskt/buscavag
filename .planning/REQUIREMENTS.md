# Scoped Requirements: Buscavag v6.0 - Sanitização e Triagem Inteligente de Vagas

## Contexto e Motivação

Os scrapers coletam vagas de 26+ fontes sem filtragem de relevância no ponto de entrada.
Isso resulta em vagas completamente fora da área de tecnologia (pedreiro, motorista, vigilante, etc.)
sendo persistidas no banco e ocupando a interface. Este milestone implementa três camadas de defesa.

---

## Requisitos Funcionais

### 1. Blacklist de Cargos Não-Tech (Filtro de Ingestão)

- [ ] **FIL-10**: Blacklist no Pipeline — Antes de avaliar qualquer vaga coletada (`src/index.ts`), checar o **título** contra uma lista de cargos operacionais/não-tech. Vagas com match devem ser **rejeitadas silenciosamente** (não persistidas, não avaliadas pela Hermes).
  - Termos iniciais: `pedreiro`, `motorista`, `vigilante`, `mecânico`, `musculação`, `serviços gerais`, `atendente`, `vendedor`, `fiscal de`, `limpeza`, `cozinheiro`, `recepcionista`, `porteiro`, `balconista`, `operador de`, `auxiliar de limpeza`, `faxineiro`, `jardineiro`, `zelador`, `segurança (vigilância)`.
  - A blacklist deve ser **configurável** — extraída de um arquivo `src/config/jobFilters.ts` para fácil manutenção.

- [ ] **FIL-11**: Tech Whitelist no Pipeline — Após passar pela blacklist, o título da vaga deve conter pelo menos um termo tech obrigatório da whitelist para ser processada. Caso contrário, rejeitar.
  - Termos iniciais: `desenvolvedor`, `developer`, `programador`, `engineer`, `engenheiro`, `frontend`, `backend`, `fullstack`, `full stack`, `mobile`, `data`, `dados`, `software`, `tech`, `qa`, `devops`, `iot`, `web`, `sistema`, `analista de sistemas`, `ti `, `tecnologia da informação`, `suporte técnico`, `infraestrutura`.

- [ ] **FIL-12**: Logging de Rejeições — Cada vaga rejeitada pelo filtro deve ser logada no console com o motivo (`[FILTRO BLACKLIST]` ou `[FILTRO WHITELIST]`), permitindo auditoria do pipeline.

### 2. Trava da Hermes IA (Triagem Automática Aprimorada)

- [ ] **SCR-10**: Trava de Score Zero — Em `HermesEvaluator`, tanto no modo IA (`evaluate()`) quanto no heurístico (`evaluateHeuristic()`):
  - Se `stackScore === 0` e nenhum termo da tech-whitelist for encontrado no título, forçar `overallScore = 0` e `isJuniorFullStack = false`.
  - Isso garante que vagas que "escaparam" dos filtros de ingestão ainda sejam bloqueadas na triagem.

- [ ] **SCR-11**: Status Automático "Descartada" — Ao inserir uma vaga com `isJuniorFullStack = false`, o `applicationStatus` inicial deve ser `'rejected'` em vez de `'pending'`. Vagas aprovadas continuam como `'pending'` (Inbox).

### 3. Script de Purga do Banco de Dados (Database Cleanup)

- [ ] **DB-10**: Rota de Purga — Criar rota `POST /api/jobs/purge-non-tech` que:
  - Execute uma query SQL deletando (ou marcando como `rejected`) todas as vagas existentes cujo `title` (LIKE case-insensitive) contenha termos da blacklist de FIL-10.
  - Retorne `{ success, deletedCount, markedCount }` no JSON de resposta.

- [ ] **DB-11**: Método no Repositório — `JobRepository.purgeNonTech(): { deletedCount: number }` que encapsula a lógica SQL de purga.

- [ ] **DB-12**: UI para Purga (Navbar ou Settings) — Adicionar na Navbar (ou em uma página de configurações mínima) um botão "Purgar Vagas Não-Tech" com SweetAlert2 de confirmação e toast de resultado.
