# Execution Roadmap: Buscavag

<details>
<summary>Milestone 1: Core Setup & Shared Modules (Completed)</summary>

[Archived Milestone 1 Details](milestones/v1.0-ROADMAP.md)
</details>

<details>
<summary>Milestone 2: Full Platform & Intelligence Evolution (Completed)</summary>

[Archived Milestone 2 Details](milestones/v2.0-ROADMAP.md)
</details>

<details>
<summary>Milestone 3: Expansão Massiva de Fontes e Especialização IoT (Completed)</summary>

[Archived Milestone 3 Details](milestones/v3.0-ROADMAP.md)
</details>

<details>
<summary>Milestone 4: Redesign Completo do Dashboard & Design System (Completed)</summary>

* Redesign UI com Shadcn, Tailwind CSS, Framer Motion e ajustes no Kanban / Explorador concluídos na v4.0.
</details>


<details>
<summary>Milestone 5: Gestão Avançada, Bulk Actions e Sincronização Real-time (Completed)</summary>

[Archived Milestone 5 Details](milestones/v5.0-ROADMAP.md)
</details>


---

# Milestone 6: Sanitização e Triagem Inteligente de Vagas

## Phase 23: Configuração Central de Filtros e Purga do Banco
- Criar `src/config/jobFilters.ts` com as listas `TITLE_BLACKLIST` e `TECH_WHITELIST` como arrays exportados.
- Implementar `JobRepository.purgeNonTech()` que deleta vagas existentes com títulos na blacklist.
- Criar rota `POST /api/jobs/purge-non-tech` que executa a purga e retorna `{ deletedCount }`.
- **Requirements:** DB-10, DB-11, FIL-10, FIL-11

## Phase 24: Filtros de Ingestão no Pipeline Principal
- Integrar blacklist e whitelist no loop de ingestão em `src/index.ts` (antes de `repo.exists()`).
- Adicionar logging de rejeições com motivo (`[FILTRO BLACKLIST]` / `[FILTRO WHITELIST]`).
- Atualizar `HermesEvaluator` com a trava de score zero (stackScore=0 + sem whitelist no título → score=0, rejected).
- Atualizar `repo.insert()` para definir `applicationStatus = 'rejected'` quando `isJuniorFullStack = false`.
- **Requirements:** FIL-10, FIL-11, FIL-12, SCR-10, SCR-11

## Phase 25: UI de Purga e Feedback (Navbar + Settings)
- Adicionar botão "Purgar Não-Tech" na Navbar (desktop e mobile) com SweetAlert2 de confirmação.
- Exibir toast de resultado com contagem de vagas removidas.
- Atualizar o `SyncToast` ou criar novo evento `buscavag:purge-done` para feedback cross-component.
- **Requirements:** DB-12
