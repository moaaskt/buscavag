# Project Details

## Current State

- **Shipped Milestone**: v12.0 — Polimento UI/UX, Total Multi-tenancy, Scraper Stream & Zero-State DB (2026-09-11)
- **Active Milestone**: v13.0 — Sistema Completo de Assinaturas (Stripe/Mercado Pago) & Notificações WhatsApp

<details>
<summary>Previous Milestones</summary>

- v1.0 — Core Setup & Shared Modules
- v2.0 — Full Platform & Intelligence Evolution
- v3.0 — Expansão Massiva de Fontes e Especialização IoT
- v4.0 — Redesign Completo do Dashboard & Design System (Shadcn + Framer Motion)
- v5.0 — Gestão Avançada, Bulk Actions e Sincronização Real-time
- v6.0 — Sanitização e Triagem Inteligente de Vagas
- v7.0 — Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros
- v8.0 — Expansão Massiva de Fontes (11 Canais & Freelas 48h), Hub Florianópolis e Melhorias no Card
- v9.0 — Motor Híbrido Scrapling (Python/FastAPI) e Blindagem 100% dos Scrapers (34 fontes auditadas)
- v10.0 — Painel do Candidato, Análise de CV com IA e Fundação SaaS
- v11.0 — Painel Admin, RBAC e Refatoração de UI

</details>

## What's in next milestone (v12.0)

- **Isolamento Multi-tenant do Kanban (`/board`)**: O board será filtrado estritamente por candidato (`userId`), iniciando em zero-state e sendo populado apenas por vagas com interações (`user_saved_jobs`).
- **Paywall Free na Análise de CV**: Limitação de 1 execução única da análise de currículo para usuários Free, com bloqueios no Backend (403) e na UI (Up-sell Pro).
- **Sincronização de Bio**: O Resumo Executivo extraído pela IA será sincronizado diretamente para a "Bio" do candidato em `candidate_profiles`.
- **Scraper Stream & Visual Feedback**: Ajustes e polimento na execução/streaming dos scrapers com suporte para visualização em tempo real e tratamento de zero-state DB.

## Next Milestone Goals

- Finalizar features de assinaturas e integrações de pagamentos (Stripe/Mercado Pago).
- Integração de envio de Cover Letters via WhatsApp e Notificações de Match Diárias.
