# 🧱 Núcleo Tecnológico (Stack Oficial) — OpaHours Backend

> Registro oficial das tecnologias e padrões já definidos para o backend (MVP).

## Runtime e framework

* Node.js LTS
* Fastify
* TypeScript (ESM)

## Validação e configuração

* Zod para validação de payloads HTTP
* Zod para validação de ambiente em `src/config/env.ts`
* dotenv para carregar `.env`

## Persistência

* PostgreSQL
* Drizzle ORM
* Migrações em `src/infrastructure/db/migrations`
* `drizzle.config.ts` com `schema` em `src/infrastructure/db/schema`

## Auth e sessão

* JWT access token (Bearer)
* Refresh token em cookie HttpOnly (`refreshToken`)
* Rotação de refresh token a cada refresh
* Modo single-user: apenas 1 usuário ativo no sistema e 1 sessão de refresh por login

## Classificação de rotas

* Rotas com metadado `config.access`:
* `public` para endpoints sem autenticação
* `private` para endpoints protegidos com `app.authenticate`

## Observabilidade e documentação

* Pino para logging estruturado
* Healthcheck: `GET /health`
* Swagger/OpenAPI com Fastify Swagger + Swagger UI

## Qualidade

* Vitest (unit e API)
* ESLint
* Prettier
* Build TypeScript (`npm run build`)

## Scripts operacionais definidos

* `npm run dev`
* `npm run db:check` para validar conexão com banco (`DB_CONNECTION_OK`)
* `npm run db:generate`
* `npm run db:migrate`
* `npm run lint`
* `npm run test`
