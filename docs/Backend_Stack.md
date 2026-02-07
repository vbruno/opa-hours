# 🧱 Núcleo Tecnológico (Stack Oficial) — OpaHours Backend

> Registro oficial das tecnologias do núcleo do backend (MVP).

## Runtime

* Node.js **LTS**

## Linguagem / validação

* TypeScript
* Zod

## Persistência

* PostgreSQL
* **Drizzle ORM**

## Transações e concorrência

* Usar transações nos casos críticos:

  * gerar rascunho
  * emitir invoice
  * revision/versionamento
* **Idempotency key** em ações sensíveis (ex: emitir invoice) — fase 2

## Auth

* JWT + Refresh Token

## PDF (Invoice)

* Playwright (PDF via HTML/CSS)

## Storage

* PDFs (e futuros anexos) em **container dedicado** com volume persistente

## Observabilidade e confiabilidade

* Pino (logging)
* Sentry (opcional)
* Healthcheck endpoint: `GET /health`

## Documentação de API

* Swagger/OpenAPI (Fastify Swagger)

## Configuração de ambiente

* dotenv (carregar `.env`)
* validação de env com Zod (recomendado)

## Qualidade / Testes

* Vitest (unit e integration)
* ESLint
* Prettier

## Infra mínima

* Docker Compose (API + DB + storage)
* Migrações rodando no deploy
* Seeds para cliente padrão e prestador
