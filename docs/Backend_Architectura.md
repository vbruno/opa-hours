# 🏛️ Arquitetura Oficial (MVP) — OpaHours Backend

> Registro oficial da arquitetura do backend (decisões fechadas).

## Decisões fechadas

* Framework HTTP: **Fastify**
* Transações: **UnitOfWork**
* Auth: JWT + refresh token em cookie HttpOnly
* Acesso HTTP classificado por rota: `public` e `private`
* Modo de conta: single-user (sem roles/members)

---

## Estilo

* **Clean Architecture + DDD light (modular)**

---

## Camadas

1. **Domain**

* Entidades, Value Objects, invariantes e cálculos
* Sem dependências de DB/HTTP

2. **Application**

* Casos de uso (commands/handlers)
* Orquestração de regras e transações
* Depende de interfaces (ports) e do Domain

3. **Infrastructure**

* Drizzle (repositories + schema + migrations em `src/infrastructure/db/migrations`)
* Auth (JWT + refresh)
* PDF (Playwright)
* Storage (container + volume)
* Logger (Pino) / Sentry

4. **API / Delivery**

* Fastify routes/controllers
* Validação com Zod
* Swagger/OpenAPI

---

## Organização por Módulos

* `work-logs`
* `invoices`
* `clients`
* `auth`
* `users`
* `shared`

---

## Transações Críticas (UnitOfWork obrigatório)

* Gerar rascunho de invoice
* Emitir invoice
* Revision/versionamento
