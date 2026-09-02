# Sistema Autônomo de Monitoramento de Vagas (Buscavag)

Sistema autônomo para coleta, filtragem por IA e notificação via Telegram de vagas de **Dev Full Stack Jr / Junior**, projetado para execução contínua (24/7) em VPS Linux com orquestração via Hermes Agent.

## Core Value
Garantir a identificação rápida e qualificada de vagas recentes (máximo 5 dias) para Dev Full Stack Jr em plataformas chave (LinkedIn, Indeed, Gupy, Google Jobs, Telegram) com zero ruído e alertas automáticos via Telegram.

## Requirements

### Validated
(Nenhum ainda — enviar em produção para validar)

### Active
- [ ] **Scrapers de Vagas (Node.js/TypeScript + Playwright)**: Coletar vagas do LinkedIn, Indeed, Gupy e Google Jobs.
- [ ] **Coletor Telegram (Telethon / Node Client)**: Monitorar grupos e canais do Telegram focados em vagas de dev/tech.
- [ ] **Filtro Temporal**: Descartar vagas com data de publicação superior a 5 dias.
- [ ] **Filtragem e Validação por IA (Hermes Agent)**: Avaliar descrição da vaga e classificar se é compatível com perfil 'Full Stack Junior' (removendo vagas Pleno/Sênior ou sem relação).
- [ ] **Sistema de Notificação via Telegram Bot (Grammy / node-telegram-bot-api)**: Enviar resumos formatados das vagas aprovadas para o chat/canal do usuário com links diretos.
- [ ] **Deduplicação e Persistência**: Armazenar histórico em banco SQLite para não reenviar vagas já notificadas.
- [ ] **Orquestração e Agendamento (Cron / Systemd)**: Agendamento automático 2x ao dia na VPS Linux.

### Out of Scope
- Candidatura automática às vagas (auto-apply) — Foco inicial é notificação imediata e curadoria qualificada.
- Interface Web Dashboard no MVP — Notificações diretas no Telegram são o canal primário.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node.js + TypeScript (Playwright & Grammy) | Ecossistema robusto para scraping web moderno e bot de Telegram com tipagem forte | — Pending |
| Estrutura Modular (CLI + Scraping + Hermes Agent) | Facilita testes isolados de scrapers e manutenção contínua | — Pending |
| SQLite para Deduplicação | Leve, sem necessidade de infraestrutura pesada para servidor em VPS | — Pending |

## Context
- **Alvo**: Vagas de Dev Full Stack Jr publicadas nos últimos 5 dias.
- **Ambiente**: VPS Linux 24/7.
- **Integrações**: LinkedIn, Indeed, Gupy, Google Jobs, Telegram Groups e Telegram Bot.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-02 after initialization*
