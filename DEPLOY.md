# Guia de Implantação e Automação na VPS - Buscavag

Este documento detalha como implantar o **Buscavag** em uma VPS Linux para execução autônoma 24/7.

---

## 1. Pré-requisitos na VPS Linux

- Node.js (v18 ou superior) e npm.
- Git.
- Instalação das dependências nativas do Playwright Chromium no Linux:

```bash
npx playwright install-deps chromium
```

---

## 2. Instalação e Build do Projeto

1. Clone o repositório na VPS:
```bash
git clone https://github.com/seu-usuario/buscavag.git
cd buscavag
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```bash
cp .env.example .env
nano .env
```
Preencha o `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`.

4. Realize o build para compilar o projeto TypeScript:
```bash
npm run build
```

---

## 3. Automação de Execução via Cron (2x ao dia)

Abra o crontab do usuário:
```bash
crontab -e
```

Adicione a seguinte linha para rodar o monitoramento 2 vezes ao dia (às 08:00 e 18:00):

```cron
0 8,18 * * * cd /caminho/para/buscavag && /usr/bin/npm run prod >> /var/log/buscavag.log 2>&1
```

---

## 4. Testando a Execução Manual

Para rodar manualmente o ciclo completo a qualquer momento:

```bash
npm run start
```
