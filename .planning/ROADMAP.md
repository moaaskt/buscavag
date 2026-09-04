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


<details>
<summary>Milestone 6: Sanitização e Triagem Inteligente de Vagas (Completed)</summary>

[Archived Milestone 6 Details](milestones/v6.0-ROADMAP.md)
</details>

---

# Milestone 7: Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros

## Phase 26: Infraestrutura de Logs e Event Streaming (Backend & SSE)
- Criar migração e tabela `scraper_logs` no banco de dados SQLite (`id`, `run_id`, `scraper_name`, `level`, `message`, `details`, `created_at`).
- Implementar `LogRepository` com métodos `insertLog`, `getLogs` e `getRecentRuns`.
- Implementar `ScraperLogger` / canal global de eventos para comunicação entre processos/pipeline e API.
- Criar endpoint SSE `GET /api/scraper/stream` para streaming de eventos em tempo real.
- Instrumentar `ScraperOrchestrator` e pipeline principal para emitir logs detalhados (INFO, WARN, ERROR).
- **Requirements:** LOG-01, LOG-02, LOG-03, LOG-04

## Phase 27: Console / Terminal em Tempo Real na UI (Navbar + Drawer/Modal)
- Criar componente `ScraperTerminalModal` com visual dark/hacker (zinc-950, monospace, cores semânticas emerald/amber/rose).
- Conectar o modal ao stream SSE (`/api/scraper/stream`) com renderização linha a linha e auto-scroll dinâmico.
- Adicionar indicador de progresso e status por fonte conectada (InfoJobs, Gupy, Catho, etc.).
- Exibir card de resumo estatístico ao término do ciclo.
- Integrar abertura do terminal ao botão "Sincronizar" da Navbar.
- **Requirements:** TRM-01, TRM-02, TRM-03, TRM-04

## Phase 28: Painel de Histórico de Logs e Gestão de Erros (`/logs`)
- Criar rota `GET /api/scraper/logs` com suporte a filtros (`level`, `scraper_name`, `period`).
- Desenvolver página `/logs` com tabela de auditoria de execuções passadas.
- Implementar filtros rápidos por severidade (Erro, Alerta, Sucesso), por fonte e por período.
- Criar modal de detalhes de erro com visualização de payload/stack trace e botão para copiar logs.
- Adicionar link de acesso rápido ao Histórico de Logs na navegação.
- **Requirements:** HST-01, HST-02, HST-03, HST-04


