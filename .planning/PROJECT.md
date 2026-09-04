# Project Details

## Current State

- **Shipped Milestone**: v8.0 — Expansão Massiva de Fontes (11 Canais & Freelas 48h), Hub Florianópolis e Melhorias no Card (2026-09-04)

<details>
<summary>Previous Milestones</summary>

- v1.0 — Core Setup & Shared Modules
- v2.0 — Full Platform & Intelligence Evolution
- v3.0 — Expansão Massiva de Fontes e Especialização IoT
- v4.0 — Redesign Completo do Dashboard & Design System (Shadcn + Framer Motion)
- v5.0 — Gestão Avançada, Bulk Actions e Sincronização Real-time
- v6.0 — Sanitização e Triagem Inteligente de Vagas
- v7.0 — Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros

</details>

## What's in v8.0

- **Destaque Visual no `JobCard`**: Palavra "Aprovada" em verde e "Rejeitada"/"Descartada" em vermelho no parecer da IA.
- **Hub Florianópolis no HermesEvaluator**: Vagas presenciais e híbridas em Florianópolis/Floripa aceitas com pontuação máxima de localização (`locationScore = 100`).
- **Filtro de Localização / Cidade**: Seletor no Explorador `/jobs`, API `GET /api/jobs` e `JobRepository` com suporte a cidades e busca remota.
- **Módulo Freelance (99Freelas 48h)**: Scraper de projetos em 99freelas com filtro estrito de tech stack e trava rigorosa de 48 horas.
- **10 Novas Fontes Tech**: GeekHunter, Nerdin (TI SC), Revelo, 99jobs, Sólides, RunTalent, Empregare, Workana, Trampos.co e Programathor revisado, totalizando 35+ canais integrados.

## Next Milestone Goals

- Definições de novos requisitos e roadmap para o próximo marco (use `/gsd-new-milestone`).
