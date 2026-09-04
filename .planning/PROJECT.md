# Project Details

## Current State

- **Shipped Milestone**: v7.0 — Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros (2026-09-04)

<details>
<summary>Previous Milestones</summary>

- v1.0 — Core Setup & Shared Modules
- v2.0 — Full Platform & Intelligence Evolution
- v3.0 — Expansão Massiva de Fontes e Especialização IoT
- v4.0 — Redesign Completo do Dashboard & Design System (Shadcn + Framer Motion)
- v5.0 — Gestão Avançada, Bulk Actions e Sincronização Real-time
- v6.0 — Sanitização e Triagem Inteligente de Vagas

</details>

## What's in v7.0

- **Infraestrutura de Logs & Auditoria SQLite**: Tabela `scraper_logs` indexada com `LogRepository` suportando consultas paginadas e métricas agregadas de ciclo.
- **Streaming SSE Anti-Buffering**: Endpoint `GET /api/scraper/stream` via `ReadableStream` com headers `text/event-stream` e heartbeat pings.
- **Resiliência Total no ScraperOrchestrator**: Execuções isoladas em `try/catch` para que falhas em fontes individuais salvem `ERROR` + stack trace sem interromper o restante do pipeline.
- **Terminal Modal Hacker em Tempo Real**: Interface escura estilo IDE na Navbar para acompanhar a sincronização linha a linha com auto-scroll e resumo final.
- **Tela de Histórico de Logs (`/logs`)**: Painel com alternância de abas (Logs e Ciclos), filtros rápidos multi-critério (severidade, 24+ fontes, períodos) e modal de stack trace com cópia instantânea para clipboard.

## Next Milestone Goals

- Definições de novos requisitos e roadmap para o próximo marco (use `/gsd-new-milestone`).
