# Project Details

## Current State

- **Shipped Milestone**: v6.0 — Sanitização e Triagem Inteligente de Vagas (2026-09-04)

<details>
<summary>Previous Milestones</summary>

- v1.0 — Core Setup & Shared Modules
- v2.0 — Full Platform & Intelligence Evolution
- v3.0 — Expansão Massiva de Fontes e Especialização IoT
- v4.0 — Redesign Completo do Dashboard & Design System (Shadcn + Framer Motion)
- v5.0 — Gestão Avançada, Bulk Actions e Sincronização Real-time

</details>

## What's in v6.0

- **Blacklist Centralizada de Cargos**: Configuração em `src/config/jobFilters.ts` para descarte imediato no pipeline de termos operacionais (pedreiro, motorista, etc.).
- **Tech-Whitelist Obrigatória**: Vagas só entram no pipeline de avaliação se o título contiver termos de tecnologia.
- **Hermes IA Zero-Score Lock**: Trava automática que força `score=0` e reprovação quando `stackScore=0` e nenhum termo tech existe no título.
- **Auto Status 'rejected'**: Vagas não aprovadas como Júnior Full Stack são automaticamente inseridas com `applicationStatus = 'rejected'`, preservando o Inbox limpo.
- **Banco de Dados Purge API & SQL**: `JobRepository.purgeNonTech()` e rota `POST /api/jobs/purge-non-tech`.
- **UI de Purga na Navbar**: Botão rápido "Purgar Não-Tech" Desktop & Mobile com modal SweetAlert2 e toast de confirmação.

## Next Milestone Goals — v7.0

**Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros dos Scrapers**
- **Infraestrutura de Logs & Event Streaming**: Tabela `scraper_logs` no SQLite, endpoint de streaming via SSE (`/api/scraper/stream`), e adaptação dos scrapers com disparos estruturados de logs (INFO, WARN, ERROR).
- **Console Terminal em Tempo Real (UI/UX)**: Modal/Drawer estilo Terminal Hacker escuro na Navbar com streaming SSE, auto-scroll, indicador de progresso por scraper/fonte e resumo final de execução.
- **Painel de Histórico de Logs & Diagnóstico**: Página/Modal de histórico (`/logs`) com filtros por status, fonte e data, exibição de stack trace expansível e cópia de detalhes de erro.
