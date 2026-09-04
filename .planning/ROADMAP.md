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

<details>
<summary>Milestone 7: Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros (Completed)</summary>

[Archived Milestone 7 Details](milestones/v7.0-ROADMAP.md)
</details>

---

# Milestone 8: Expansão Massiva de Fontes (11 Canais & Freelas 48h), Hub Florianópolis e Melhorias no Card

### Phase 29: UI & Core Evaluator Enhancements
- [ ] **Phase 29.1**: Destaque visual colorido no `JobCard` (palavras "Aprovada" em verde e "Rejeitada"/"Descartada" em vermelho no feedback da IA).
- [ ] **Phase 29.2**: Atualização da regra de localização em `HermesEvaluator` para aceitar `Presencial` e `Híbrido` em Florianópolis / Floripa / Florianópolis - SC.
- [ ] **Phase 29.3**: Adição de filtro de Localização/Cidade no Explorador de Vagas (`/jobs`), na API `GET /api/jobs` e no `JobRepository`.

### Phase 30: Módulo Freelance (99Freelas com Trava 48h)
- [ ] **Phase 30.1**: Criação do conector `99FreelasScraper` com suporte a extração de projetos em `99freelas.com.br/projects`.
- [ ] **Phase 30.2**: Aplicação de filtro estrito de tech stack (React, Next, Node, JS, TS, Python, IoT, etc.).
- [ ] **Phase 30.3**: Trava de 48 horas para descarte de oportunidades publicadas há mais de 2 dias e categorização como `Freelance`.

### Phase 31: Expansão das 10 Novas Fontes de Vagas Tech
- [ ] **Phase 31.1**: Criação dos adaptadores de vagas tech: `GeekHunter`, `Nerdin`, `Programathor` (revisão), `Revelo`, `99jobs`.
- [ ] **Phase 31.2**: Criação dos adaptadores de vagas tech: `Sólides`, `RunTalent`, `Empregare`, `Workana`, `Trampos.co`.
- [ ] **Phase 31.3**: Registro no enum `PlatformSource`, integração no `ScraperOrchestrator`, filtros do Explorador, Navbar e testes de execução.
