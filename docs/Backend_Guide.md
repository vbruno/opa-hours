# 🧩 Backend Guide — OpaHours

> Documento vivo para acompanhamento do backend do **OpaHours** (Node.js + PostgreSQL).
> Foco: domínio, casos de uso, modelo de dados, invariantes, APIs e checklist de implementação.

---

## 1) Objetivo do Backend

Garantir **consistência financeira e rastreabilidade** entre:

**Horas → Lançamentos → Invoice (rascunho) → Invoice (emitida) → Pagamento**

Princípios:

* Regra de negócio no backend (fonte da verdade)
* Transações nas operações críticas
* Imutabilidade após emissão (com **versionamento** para correções)

---

## 2) Decisões Fechadas

### ✅ D1 — Cliente no Lançamento

* `cliente_id` é **obrigatório** em `LançamentoHora`
* existe **cliente padrão**
* se houver clientes diferentes no mesmo dia → criar **lançamentos separados**

### ✅ D2 — Adicional (Dia e Item)

* `adicional_dia` e `adicional_item`

**Cálculo oficial:**

* **Total do dia** = (duração_total × valor_hora) + adicional_dia + Σ(adicional_item)

### ✅ D3 — Itens da Invoice (2 modos)

* **Padrão:** consolidar por **local** (1 linha por endereço)
* **Alternativa:** detalhado (1 linha por lançamento)
* rastreabilidade sempre via `invoice_lancamentos`

### ✅ D4 — Autenticação e Sessão (MVP atual)

* access token via Bearer token
* refresh token via cookie HttpOnly
* refresh com rotação de token
* logout idempotente limpando cookie

### ✅ D5 — Modelo de Usuário (MVP atual)

* modo **single-user**
* sem `member` e sem `role`
* CRUD de usuário limitado à própria conta (self only)

### ✅ D6 — Classificação de Rotas

* toda rota deve declarar `config.access` como `public` ou `private`
* rotas `private` usam `app.authenticate`

### ✅ D7 — Contrato de Erro Padronizado

* payload de erro da API padronizado com `code`, `message`, `details`, `requestId`
* validação de payload retorna `VALIDATION_ERROR` com `details.issues[]`
* mensagens de erro centralizadas em catálogo único (`errorMessages.ts`)
* `code` é o identificador estável para frontend e logs; `message` é texto legível (sem necessidade de parse de código)
* erros de domínio devem manter catálogo próprio de mensagens e mapeamento HTTP centralizado por código
* o plugin global de erro deve apenas traduzir erro tipado -> resposta padrão (sem regra de status espalhada em rotas)

Exemplo de payload:

```json
{
  "code": "WORK_LOG_INVALID_DATE",
  "message": "Work date must follow YYYY-MM-DD format",
  "details": null,
  "requestId": "req-123"
}
```

---

## 3) Invariantes (Regras que NUNCA podem quebrar)

### Lançamentos

* `unique(pessoa_id, cliente_id, data)`
* lançamento **invoiced** não pode ser editado financeiramente
* lançamento só pode estar em **uma** invoice
* `hora_inicio`, `hora_fim`, `break_min`, `duracao_min` e `valor_total` do lançamento são derivados dos itens
* `draft` pode existir sem item temporariamente, mas `linked`/`invoiced` exige ao menos 1 item
* todo item deve pertencer ao mesmo `workDate` do lançamento

### Invoices

* invoice contém lançamentos de **um único cliente**
* invoice **emitida** não pode ser reaberta
* correção após emissão gera **nova versão**; versão anterior vira **Substituída**

---

## 4) Modelo de Dados (PostgreSQL)

> Ajustável, mas esta é a base recomendada.

### 4.1 Tabelas

#### `pessoas`

* id (uuid)
* nome
* email
* endereco
* valor_hora_padrao_cents (int, opcional)
* aplica_gst (bool)
* gst_percentual (int, opcional)

#### `clientes`

* id (uuid)
* nome
* abn
* endereco

#### `lancamentos_hora`

* id (uuid)
* pessoa_id (fk)
* cliente_id (fk, obrigatório)
* data (date)
* hora_inicio (timestamp with time zone, derivado do menor `start_at` dos itens)
* hora_fim (timestamp with time zone, derivado do maior `end_at` dos itens)
* break_min (int, derivado da soma de breaks dos itens)
* duracao_min (int, derivado da soma de duração líquida dos itens)
* adicional_dia_cents (int, default 0)
* valor_total_cents (int, derivado)
* observacoes (text, opcional)
* status_faturamento (enum: draft|linked|invoiced)
* created_at
* updated_at

**Constraints**

* unique(pessoa_id, cliente_id, data)

#### `lancamentos_itens`

* id (uuid)
* lancamento_id (fk)
* endereco (text)
* start_at (timestamp with time zone)
* end_at (timestamp with time zone)
* break_min (int)
* duracao_min (int, derivado)
* valor_hora_cents (int)
* adicional_item_cents (int, default 0)
* observacoes (text, opcional)
* created_at
* updated_at

#### `invoices`

* id (uuid)
* numero (int)
* versao (int)
* pessoa_id (fk)
* cliente_id (fk)
* periodo_inicio (date)
* periodo_fim (date)
* status (enum: rascunho|emitida|enviada|paga|substituida)
* subtotal (numeric)
* gst_total (numeric)
* total (numeric)
* invoice_anterior_id (fk opcional)
* criada_em (timestamp)
* emitida_em (timestamp, opcional)
* paga_em (timestamp, opcional)

**Constraints**

* unique(numero, versao)

#### `invoice_itens`

* id (uuid)
* invoice_id (fk)
* descricao (text)
* endereco (text)
* valor (numeric)
* ordem (int, opcional)

#### `invoice_lancamentos`

* invoice_id (fk)
* lancamento_id (fk)

**Constraints**

* unique(lancamento_id)

---

## 5) Estados e Transições

### 5.1 Status do Lançamento

* **Draft → Linked → Invoiced**
* Linked volta para Draft se o rascunho for cancelado/excluído

### 5.2 Status da Invoice

* **Rascunho → Emitida → Enviada → Paga**
* **Substituída** (somente para versões antigas após revisão)

---

## 6) Casos de Uso (Application Layer)

### Lançamentos

* UC01 — CreateWorkLog
* UC02 — UpdateWorkLog *(bloquear se `invoiced`)*
* UC03 — DeleteWorkLog *(bloquear se `invoiced`)*
* UC04 — ListWorkLogs (filtros: período, cliente, status)

### Invoices

* UC05 — CreateInvoiceDraftFromSelection (manual)
* UC06 — CreateInvoiceDraftAuto (período/local/cliente)
* UC07 — EmitInvoice *(transação crítica)*
* UC08 — MarkInvoiceSent
* UC09 — MarkInvoicePaid
* UC10 — CreateInvoiceRevision (versionamento)
* UC11 — GetInvoice (detalhe)
* UC12 — ListInvoices (filtros)
* UC13 — GetInvoicePdf

---

## 7) Transações Críticas (Obrigatórias)

### T1 — Criar Rascunho de Invoice

Em uma transação:

* criar invoice (rascunho)
* criar invoice_itens
* criar invoice_lancamentos
* setar lançamentos para **Linked**

### T2 — Emitir Invoice

Em uma transação:

* validar status rascunho
* congelar subtotal/gst/total
* mudar para **Emitida**
* setar lançamentos para **Invoiced**

> PDF pode ser gerado pós-commit, mas o registro de emissão não pode falhar.

### T3 — Revisão/Versionamento

Em uma transação:

* criar nova invoice (versão+1) em rascunho
* copiar/gerar itens e vínculos
* ao emitir a nova, marcar a anterior como **Substituída**

---

## 8) API (Contrato atual / proximo passo)

### 8.0 Auth e Users (implementado no foundation)

* `POST /auth/login` (public)
* `POST /auth/refresh` (public)
* `POST /auth/logout` (public)
* `GET /auth/me` (private)
* `POST /users` (public, bootstrap de primeiro usuário)
* `GET /users` (private, retorna somente o usuário autenticado)
* `GET /users/:id` (private, self only)
* `PUT /users/:id` (private, self only)
* `DELETE /users/:id` (private, self only)

### 8.1 Work Logs (implementado na Etapa 2)

* `GET /work-logs?personId&from&to&clientId&status`
* `GET /work-logs/:id`
* `POST /work-logs`
* `PUT /work-logs/:id`
* `DELETE /work-logs/:id`

Observacoes do contrato atual:

* `personId` ainda e explicito no CRUD/listagem porque o relacionamento tecnico entre `auth_users` e `pessoas` ainda nao foi modelado
* `GET /work-logs` exige `personId`
* `POST /work-logs` e `PUT /work-logs/:id` aceitam `items` opcionais enquanto o lancamento estiver em `draft`
* validacao e documentacao OpenAPI ja publicadas no Swagger da API

### 8.2 Invoices

* `POST /invoices/draft` *(manual: lista de lancamentoIds)*
* `POST /invoices/draft/auto` *(por período/local/cliente)*
* `POST /invoices/:id/emit`
* `POST /invoices/:id/mark-sent`
* `POST /invoices/:id/mark-paid`
* `POST /invoices/:id/revise`
* `GET /invoices?from&to&clientId&status`
* `GET /invoices/:id`
* `GET /invoices/:id/pdf`

---

## 9) Regras de Cálculo (Fonte da Verdade)

### 9.1 Duração do Lançamento

* cada item calcula `duracao_min = (end_at - start_at) - break_min`
* o lançamento consolida `hora_inicio`, `hora_fim`, `break_min` e `duracao_min` a partir dos itens

### 9.2 Multi-local no Dia

* `Σ(itens.duracao_min) == lancamento.duracao_min`
* `hora_inicio = min(itens.start_at)`
* `hora_fim = max(itens.end_at)`
* item não pode cruzar o dia de referência do lançamento

### 9.3 Total do Dia

* `valor_total = Σ(itens.valor_total) + adicional_dia`

### 9.4 Invoice — Modo Padrão (Consolidar por Local)

* agrupar por `endereco`
* somar valores associados aos lançamentos vinculados

### 9.5 GST (Opcional)

* se `aplica_gst = true`:

  * calcular por item (preferencial)
  * `total = subtotal + gst_total`

---

## 10) Checklist de Implementação

### Base

* [x] Setup projeto (Node + TS + Fastify)
* [x] Conexão PostgreSQL
* [x] Migrações / schema com Drizzle
* [x] Validação de env com Zod
* [x] Logging estruturado (Pino)
* [x] Swagger/OpenAPI e `GET /health`
* [x] Script de validação de conexão: `npm run db:check`

### Domínio

* [x] Entidades e invariantes
* [x] Cálculos (duração, total do dia)

### Casos de uso

* [x] UC01–UC04 (Work Logs)
* [ ] UC05–UC07 (Draft/Emit)
* [ ] UC08–UC10 (Status/Revision)

### API

* [x] Rotas + validação (base/auth/users)
* [x] Erros padronizados
* [x] Autenticação (JWT + refresh cookie)
* [x] Classificação de acesso (`public` / `private`)
* [x] Regra ativa: toda mudança de API deve refletir em Swagger/OpenAPI
* [x] Rotas de `work-logs`
* [ ] Rotas de `invoices`

### PDF

* [ ] Template (invoice)
* [ ] Geração e storage

### Testes

* [x] Unit (cálculos/invariantes)
* [x] Integration (`auth`, `users` e CRUD de `work-logs` em banco de teste)
* [ ] Integration (transações críticas de invoice)

---

## 11) Log de Decisões (para ir atualizando)

* [x] 2026-02-10: base do backend concluída (env, db connection, health, swagger, cors, logger)
* [x] 2026-02-10: criado comando `npm run db:check` para validar conexão com DB
* [x] 2026-02-15: auth definido com refresh token em cookie HttpOnly
* [x] 2026-02-15: sistema fechado em modo single-user sem roles/members
* [x] 2026-02-15: rotas classificadas com `config.access` (`public` / `private`)
* [x] 2026-02-15: error handler extraído para plugin dedicado e contrato de erro HTTP padronizado
* [x] 2026-02-15: validações de usuário reforçadas em API + serviço + constraints no banco
* [x] 2026-02-28: Etapa 2 concluida com CRUD de `work-logs`, Swagger atualizado e testes de integracao validados em banco de teste local
