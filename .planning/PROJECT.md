# Project Details

## Current State

- **Shipped Milestone**: v5.0 — Gestão Avançada, Bulk Actions e Sincronização Real-time (2026-09-04)

<details>
<summary>Previous Milestones</summary>

- v1.0 — Core Setup & Shared Modules
- v2.0 — Full Platform & Intelligence Evolution
- v3.0 — Expansão Massiva de Fontes e Especialização IoT
- v4.0 — Redesign Completo do Dashboard & Design System (Shadcn + Framer Motion)

</details>

## What's in v5.0

- **Bulk Actions**: Seleção em lote via checkboxes nos cards + FloatingActionBar para exclusão e mudança de status em massa
- **Quick Status**: Dropdown direto no JobCard para alterar status sem abrir modal
- **Period Filter**: Filtro de recência (24h / 48h / 7d / 30d) com lógica SQL no repositório
- **Scraper Real-time**: Botão Sincronizar na Navbar dispara `POST /api/scraper/trigger`, exibe SyncToast animado e refetch automático da página `/jobs`
- **SweetAlert2**: Confirmações de exclusão com tema dark customizado (zinc-950 + rose)

## Next Milestone Goals

_A definir. Use `/gsd-new-milestone` para iniciar o planejamento do v6.0._
