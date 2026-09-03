# 🚀 Deploy - Buscavag

Guia rápido para deploy do Buscavag em produção usando Docker Compose.

## Pré-requisitos

- Docker >= 24.0
- Docker Compose >= 2.20
- Arquivo `.env` configurado na raiz do projeto

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# OpenAI (para o Hermes Evaluator)
OPENAI_API_KEY=sua_chave_aqui

# Agendamento (opcional, padrão: a cada 4 horas)
CRON_SCHEDULE=0 */4 * * *
```

## Comandos

### Build das imagens
```bash
docker-compose build
```

### Iniciar em background
```bash
docker-compose up -d
```

### Ver logs em tempo real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas o scraper
docker-compose logs -f scraper

# Apenas o dashboard
docker-compose logs -f web
```

### Parar os serviços
```bash
docker-compose down
```

### Rebuild após atualização de código
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  Docker Compose                  │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  buscavag-web    │  │  buscavag-scraper    │  │
│  │  (Next.js)       │  │  (Node + Playwright) │  │
│  │  Porta: 3000     │  │  node-cron (4h)      │  │
│  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                       │              │
│           └───────────┬───────────┘              │
│                       │                          │
│              ┌────────▼────────┐                 │
│              │  buscavag-data  │                 │
│              │  (Volume)       │                 │
│              │  buscavag.db    │                 │
│              └─────────────────┘                 │
└─────────────────────────────────────────────────┘
```

- **buscavag-web**: Dashboard Next.js acessível em `http://localhost:3000`
- **buscavag-scraper**: Processo contínuo executando os scrapers a cada 4h via `node-cron`
- **buscavag-data**: Volume Docker compartilhado contendo o banco SQLite

## Monitoramento

Os alertas de falha nos scrapers são enviados automaticamente para o chat do Telegram configurado, com a tag `⚠️ [ALERTA DE SISTEMA]`.

Para verificar a saúde do sistema:
```bash
# Verificar se os containers estão rodando
docker-compose ps

# Verificar uso de recursos
docker stats buscavag-web buscavag-scraper
```
