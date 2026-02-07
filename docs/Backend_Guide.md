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

---

## 3) Invariantes (Regras que NUNCA podem quebrar)

### Lançamentos

* `unique(pessoa_id, data)`
* lançamento **faturado** não pode ser editado financeiramente
* lançamento só pode estar em **uma** invoice
* se lançamento tiver múltiplos itens: `Σ(itens.duracao_min) == lancamento.duracao_min`

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
* valor_hora_padrao (numeric, opcional)
* aplica_gst (bool)
* gst_percentual (numeric, opcional)

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
* hora_inicio (time)
* hora_fim (time)
* break_min (int)
* duracao_min (int)
* valor_hora (numeric)
* adicional_dia (numeric, opcional)
* valor_total (numeric)
* observacoes (text, opcional)
* status_faturamento (enum: aberto|vinculado|faturado)

**Constraints**

* unique(pessoa_id, data)

#### `lancamentos_itens`

* id (uuid)
* lancamento_id (fk)
* endereco (text)
* duracao_min (int)
* adicional_item (numeric, opcional)
* observacoes (text, opcional)

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

* **Aberto → Vinculado → Faturado**
* Vinculado volta para Aberto se o rascunho for cancelado/excluído

### 5.2 Status da Invoice

* **Rascunho → Emitida → Enviada → Paga**
* **Substituída** (somente para versões antigas após revisão)

---

## 6) Casos de Uso (Application Layer)

### Lançamentos

* UC01 — CreateWorkLog
* UC02 — UpdateWorkLog *(bloquear se faturado)*
* UC03 — DeleteWorkLog *(bloquear se faturado)*
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
* setar lançamentos para **Vinculado**

### T2 — Emitir Invoice

Em uma transação:

* validar status rascunho
* congelar subtotal/gst/total
* mudar para **Emitida**
* setar lançamentos para **Faturado**

> PDF pode ser gerado pós-commit, mas o registro de emissão não pode falhar.

### T3 — Revisão/Versionamento

Em uma transação:

* criar nova invoice (versão+1) em rascunho
* copiar/gerar itens e vínculos
* ao emitir a nova, marcar a anterior como **Substituída**

---

## 8) API (Contratos sugeridos)

### 8.1 Work Logs

* `POST /work-logs`
* `PUT /work-logs/:id`
* `DELETE /work-logs/:id`
* `GET /work-logs?from&to&clientId&status`

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

* `duracao_min = (hora_fim - hora_inicio) - break_min`

### 9.2 Multi-local no Dia

* `Σ(itens.duracao_min) == duracao_min`

### 9.3 Total do Dia

* `valor_total = (duracao_min × valor_hora) + adicional_dia + Σ(adicional_item)`

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

* [ ] Setup projeto (Node + TS)
* [ ] Conexão PostgreSQL
* [ ] Migrações / schema

### Domínio

* [ ] Entidades e invariantes
* [ ] Cálculos (duração, total do dia)

### Casos de uso

* [ ] UC01–UC04 (Work Logs)
* [ ] UC05–UC07 (Draft/Emit)
* [ ] UC08–UC10 (Status/Revision)

### API

* [ ] Rotas + validação
* [ ] Erros padronizados
* [ ] Autenticação (quando entrar)

### PDF

* [ ] Template (invoice)
* [ ] Geração e storage

### Testes

* [ ] Unit (cálculos/invariantes)
* [ ] Integration (transações críticas)

---

## 11) Log de Decisões (para ir atualizando)

* [ ] (data) decisão X
* [ ] (data) decisão Y
