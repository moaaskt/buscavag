# Buscavag 🎯🤖

O **Buscavag** é um sistema autônomo e inteligente para monitoramento, coleta, filtragem por IA e notificação de vagas de desenvolvimento de software em tempo real. Projetado para rodar 24/7 em uma VPS Linux com agendamento via Cron/Systemd e orquestração integrada.

---

## 🌟 Principais Funcionalidades

- **Scraping Multicanal**:
  - **LinkedIn Jobs**: Coleta de vagas recentes via Playwright com mitigação stealth.
  - **Indeed Brasil**: Raspagem automatizada de posições recentes.
  - **Gupy Portal**: Ingestão via API pública do portal Gupy.
  - **Google Jobs**: Monitoramento de vagas agregadas no Google.
  - **Telegram Channels**: Coleta autônoma em canais/grupos públicos de TI do Telegram (`t.me/s/...`).
- **Filtro Temporal**: Descarte automático de vagas publicadas há mais de **5 dias**.
- **Deduplicação Inteligente**: Banco de dados **SQLite** com hash SHA256 único por vaga (URL, Empresa e Título) para evitar duplicidades e alarmes repetidos.
- **Curadoria Inteligente por IA (Hermes Agent / OpenAI API)**:
  - Avaliação de senioridade (foco em **Júnior / Entry Level / Trainee**).
  - Match de perfil técnico com a stack do dev (Node.js, TypeScript, PHP/Laravel, React, Next.js, Python, SQL, Docker).
  - Regras de geolocalização inteligentes (Remoto Global/BR/PT aprovado prioritariamente; Presencial/Híbrido focado em Palhoça/São José-SC e Híbrido em Florianópolis-SC).
  - **Motor de Heurísticas (Fallback Resiliente)** em caso de ausência ou limite de API Key.
- **Alertas e Notificações no Telegram**:
  - Bot integrado via **Grammy** enviando mensagens formatadas em HTML rico com botão de link direto e score de adequação da IA.
  - **Observabilidade**: Envio automático de alertas de sistema no Telegram se algum scraper falhar ou sofrer timeout.
  - Throttling (800ms) anti-rate-limit e anti-ETIMEDOUT.

---

## 🛠️ Stack Técnica

- **Linguagem / Runtime**: Node.js (v18+) & TypeScript
- **Web Automation**: Playwright (Chromium) & Axios
- **Bot & Notificações**: Grammy (Telegram Bot API)
- **IA / LLM**: OpenAI SDK (Hermes Agent API / OpenAI / DeepSeek / Ollama)
- **Banco de Dados**: SQLite3 via `better-sqlite3` & Zod
- **Build & Execução**: `tsx`, `tsc`

---

## 🚀 Como Executar

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone https://github.com/moanetodev/buscavag.git
cd buscavag
npm install
```

Instale as dependências nativas do Playwright Chromium:

```bash
npx playwright install chromium
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Opcional (Se omitido, o sistema usará o motor de heurísticas local)
HERMES_API_KEY=sua_api_key_aqui
HERMES_API_URL=https://api.openai.com/v1
HERMES_MODEL=gpt-3.5-turbo

DATABASE_PATH=./buscavag.db
```

### 3. Rodar em Modo de Desenvolvimento / Teste

```bash
# Testar o pipeline completo
npm run start

# Executar testes específicos
npx tsx src/test-scrapers.ts       # Testar scrapers
npx tsx src/test-telegram.ts       # Testar bot do Telegram
npx tsx src/test-ai.ts             # Testar IA / Heurísticas
npx tsx src/test-observability.ts  # Testar alertas de falhas
```

---

## 🖥️ Implantação e Automação na VPS (24/7)

### 1. Build de Produção

```bash
npm run build
```

### 2. Rodar em Produção

```bash
npm run prod
```

### 3. Agendar Execução Automática via Cron (2x ao dia)

Abra o crontab do servidor:

```bash
crontab -e
```

Adicione a seguinte regra (ex: execução às 08:00 e 18:00):

```cron
0 8,18 * * * cd /caminho/para/buscavag && /usr/bin/npm run prod >> /var/log/buscavag.log 2>&1
```

Para mais detalhes de implantação em servidores Linux, consulte o arquivo [DEPLOY.md](file:///home/moa-dev/projetos/buscavag/DEPLOY.md).

---

## 📁 Estrutura do Projeto

```text
buscavag/
├── src/
│   ├── db/                 # Conexão SQLite e JobRepository
│   ├── scrapers/           # Scrapers (LinkedIn, Indeed, Gupy, Google Jobs, Telegram)
│   ├── services/           # HermesEvaluator (IA/Heurística) e TelegramNotifier
│   ├── types/              # Definições de tipos e Schemas Zod (RawJob, ProcessedJob)
│   ├── utils/              # Parsers de datas relativas e geradores de Hash SHA256
│   └── index.ts            # Entrypoint do pipeline orquestrado
├── .env.example            # Modelo de variáveis de ambiente
├── DEPLOY.md               # Guia de deploy em VPS Linux
├── tsconfig.json           # Configuração do TypeScript
└── package.json            # Scripts e dependências
```

---

## 🛡️ Licença

Este projeto é desenvolvido para uso pessoal de automação de carreira e curadoria de oportunidades. Sinta-se à vontade para contribuir ou adaptar para seu perfil!
