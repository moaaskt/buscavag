# Scoped Requirements: Buscavag v7.0 - Observabilidade, Streaming de Logs em Tempo Real e Gestão de Erros

## Contexto e Motivação

Atualmente, a execução dos scrapers roda em processo background assíncrono com feedback restrito a toasts de início e recarregamento posterior. Quando ocorrem falhas de rede, mudanças de layout no HTML das fontes ou rejeições em lote, não há visibilidade granular imediata para o usuário.
O Milestone 7 introduz uma camada completa de **observabilidade em tempo real**, persistência de logs de auditoria e interface visual interativa (Terminal e Histórico).

---

## Requisitos Funcionais

### 1. Infraestrutura de Logs e Event Streaming (Backend)

- [x] **LOG-01**: Tabela de Logs no SQLite — Criar tabela `scraper_logs` (`id`, `run_id`, `scraper_name`, `level`: 'INFO'|'WARN'|'ERROR', `message`, `details`, `created_at`) com métodos de inserção e consulta no repositório (`LogRepository`).
- [x] **LOG-02**: Event Emitter & Logger Centralizado — Criar classe/serviço `ScraperLogger` que emite eventos em memória e persiste logs estruturados no banco.
- [x] **LOG-03**: Endpoint SSE de Streaming — Criar rota `GET /api/scraper/stream` via **Server-Sent Events (SSE)** usando `ReadableStream` no Next.js App Router com headers explícitos (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`) para evitar buffering e transmitir eventos de scraping em tempo real.
- [x] **LOG-04**: Instrumentação & Resiliência dos Scrapers — Atualizar `ScraperOrchestrator` e pipeline para emitir logs granulares (INFO, WARN, ERROR). Cada scraper deve ser isolado com `try/catch` individual para que falhas em uma fonte persistam erro e stack trace em `scraper_logs` sem interromper a execução das demais 25+ fontes.

### 2. Console / Terminal em Tempo Real no Frontend (UI/UX)

- [ ] **TRM-01**: Terminal Modal / Drawer de Sincronização — Ao acionar a sincronização na Navbar, abrir um modal/drawer estilo Terminal Hacker (fundo zinc-950, fonte mono, syntax highlighting por nível INFO/WARN/ERROR).
- [ ] **TRM-02**: Consumo SSE com Auto-scroll — Conectar o modal ao endpoint SSE, exibindo as linhas de log em tempo real com auto-scroll suave e opção de pausar scroll.
- [ ] **TRM-03**: Barra de Progresso e Status por Fonte — Exibir stepper/indicador de progresso das 26+ fontes com tags visuais de status (Aguardando, Rodando, Concluído, Falha).
- [ ] **TRM-04**: Resumo Estatístico Final — Exibir banner de encerramento com o total de vagas coletadas, avaliadas pela IA, descartadas e eventuais erros ocorridos.

### 3. Painel de Histórico de Logs & Gestão de Erros

- [ ] **HST-01**: Rota API de Consulta de Logs — Criar rota `GET /api/scraper/logs` com paginação e filtros (`level`, `scraper_name`, `run_id`, `dateRange`).
- [ ] **HST-02**: Tela / Aba de Histórico de Logs (`/logs`) — Criar página dedicada ou aba no dashboard com listagem tabular dos logs históricos das execuções de scraping.
- [ ] **HST-03**: Filtros Rápidos de Diagnóstico — Permitir filtrar rapidamente por Nível (Apenas Erros, Alertas, Info), por Fonte (InfoJobs, Gupy, LinkedIn, etc.) e período.
- [ ] **HST-04**: Detalhes do Erro & Copiar Stack Trace — Modal ou drawer expansível para inspecionar `details`/stack trace de logs com nível ERROR, acompanhado de botão "Copiar Log".
