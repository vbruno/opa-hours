# 📘 Planejamento de Domínio: OpaHours — Sistema de Controle de Horas

> Documento vivo para definição e evolução do domínio, regras de negócio e casos de uso do **OpaHours** (controle individual de horas + geração de invoices).

---

## 1) Visão Geral

O sistema permite que uma **pessoa** registre horas trabalhadas diariamente e use esses registros para:

* Controle pessoal de jornada
* Consolidação por **semana / mês**
* Cálculo financeiro baseado em **valor/hora** e **adicionais**
* Geração e gestão de **invoices** (cobrança)

**Plataforma inicial:** Web (responsivo para mobile).

---

## 2) Escopo do Domínio

### 2.1 Contexto

* Domínio central: **Controle Individual de Horas Trabalhadas**
* O sistema **não é orientado a projetos**.
* O sistema opera em **modo single-user** (sem membros/equipe).
* O faturamento é feito via **Invoice**, com rastreabilidade e versionamento.

### 2.2 Autenticação no contexto atual

* Login por email e senha.
* Sessão com access token + refresh token.
* Refresh token em cookie HttpOnly.
* Endpoints de usuário existem para gestão da própria conta.
* Não existe conceito de role/perfil na fase atual.

---

## 3) Modelo de Domínio

### 3.1 Entidades

#### 👤 Pessoa

Representa o usuário do sistema.

**Responsabilidades**

* Ser proprietária dos lançamentos
* Possuir valor/hora padrão (opcional)
* Definir se aplica GST (opcional)

---

#### 🏢 Cliente

Representa o pagador/empresa.

**Atributos**

* Nome
* ABN
* Endereço

---

#### ⏱️ LançamentoHora (Entidade Raiz)

Representa um **dia de trabalho**.

**Atributos**

* Data
* Adicional do dia (opcional)
* Observações (opcional)
* Status de faturamento
* Itens do dia (0..N em `draft`; 1..N para avançar o lançamento)
* Campos consolidados derivados dos itens: hora de início, hora de fim, break total, duração total e valor total

**Status de faturamento**

* **Draft** → ainda não vinculado a invoice
* **Linked** → associado a invoice em rascunho
* **Invoiced** → pertence a invoice emitida

**Regras de negócio (invariantes)**

* Não pode existir mais de um lançamento por pessoa + cliente na mesma data
* Break é obrigatório (mínimo zero)
* Campos consolidados do lançamento são derivados dos itens
* Um lançamento **não pode ser invoiced mais de uma vez**
* Lançamento **invoiced** não pode ser editado financeiramente
* `draft` pode existir sem item temporariamente, mas `linked`/`invoiced` exige ao menos 1 item
* Todo item deve pertencer ao mesmo `workDate` do lançamento

**Cálculo (regra principal)**

* **Valor total do dia** = Σ(total dos itens) + adicional do dia

---

#### 🧾 LançamentoItem (por Local)

Quando houver trabalho em **dois locais ou mais no mesmo dia**, os detalhes por local são registrados em itens.

**Atributos**

* Endereço / Local
* Hora de início
* Hora de fim
* Break (min)
* Duração alocada (min) — derivada do período líquido
* Valor/hora
* Adicional do item (opcional)
* Observações (opcional)

**Regras**

* Um LançamentoHora pode ter **0..N** itens enquanto estiver em `draft`
* Cada item calcula sua própria duração líquida
* O lançamento consolida os totais do dia a partir dos itens
* Cada item deve permanecer dentro do mesmo dia do lançamento

---

### 3.2 Value Objects

* **Período de Trabalho** (hora início, hora fim)
* **Duração** (tempo líquido)
* **ValorHora**
* **Endereço**
* **Período de Cobrança** (início/fim configuráveis)

---

## 4) Projeções (Read Models)

> Visões derivadas para acompanhamento. Não são editáveis manualmente.

### 4.1 Semana

**Dados**

* Número da semana (ISO)
* Data início / fim
* Total de horas
* Média diária
* Total financeiro

**Regras**

* Baseada exclusivamente nos lançamentos
* Semana inicia na segunda-feira (ISO)
* Sem lançamentos → valores zerados

### 4.2 Mês

**Dados**

* Total de horas
* Total financeiro
* Média semanal
* Média diária

**Regras**

* Consolida semanas
* Considera apenas semanas com horas lançadas

---

## 5) Domínio de Invoice (Faturamento)

### 5.1 Conceito

Uma **Invoice** representa a cobrança formal de serviços prestados em um período, com itens e totais fechados.

Princípios:

* Invoice é **financeira/legal**
* Após emissão, dados ficam **imutáveis**
* Correções são feitas por **versionamento** (nova versão substitui a anterior)

---

### 5.2 Entidade: Invoice

**Atributos principais**

* Número (sequencial)
* Versão
* Data de emissão
* Período de referência (início/fim)
* Prestador (Pessoa)
* Cliente
* Status
* Subtotal em centavos
* GST total em centavos (se aplicável)
* Total em centavos
* Referência para invoice anterior (quando houver versionamento)

**Status**

* **Draft** (editável)
* **Issued** (PDF gerado, imutável)
* **Sent**
* **Paid**
* **Superseded** (versão antiga invalidada por versão nova)

**Regras de negócio**

* Número é sequencial
* Uma invoice pode ter múltiplas versões
* Apenas a **última versão ativa** é válida financeiramente
* Invoice emitida **não é reaberta** para edição
* Alterações geram **nova versão**
* Uma invoice contém lançamentos de **um único cliente**

---

### 5.3 Entidade: Item de Invoice

Representa uma linha da invoice.

**Atributos**

* Descrição do serviço
* Local (endereço)
* Valor do item

**Regras**

* Valor do item é fechado (não depende de horas após emissão)

---

### 5.4 Entidade: Prestador (dados do emissor)

**Atributos**

* Nome
* Endereço
* Email
* ABN
* Dados bancários (banco, BSB, conta)

---

## 6) Regras de Geração de Invoice

### 6.1 Geração Manual por Seleção de Datas (fluxo principal)

**Descrição**: o usuário seleciona lançamentos para compor uma invoice.

**Fluxo**

1. Listar lançamentos por período
2. Selecionar (checkbox) lançamentos elegíveis
3. Acionar “Gerar Invoice”
4. Validar seleção
5. Criar invoice em **Rascunho**
6. Gerar itens e calcular totais
7. Marcar lançamentos como **Vinculado**

**Regras**

* Apenas lançamentos **não invoiced** podem ser selecionados
* Um lançamento só pode pertencer a **uma invoice**
* Invoice armazena **snapshot** dos valores no momento da geração

---

### 6.2 Geração Automática (assistida)

> Automação sempre passa por revisão humana (gera rascunho).

#### a) Por Período (Semanal, Quinzenal, Mensal)

**Configuração**

* Usuário define início e término do período (custom)

**Regras**

* Seleciona apenas lançamentos elegíveis (não invoiced)
* Cria invoice em **Rascunho**

#### b) Por Local

**Regras**

* Agrupa por endereço/local
* Pode gerar 1 invoice por local (opcional)
* Pode ser combinado com período

#### c) Por Cliente

**Regras**

* Seleciona lançamentos de um cliente
* Bloqueia mistura de clientes na mesma invoice

---

## 7) Emissão, Envio, Pagamento e Correções

### 7.1 Emissão (fechamento legal)

**Fluxo**

1. Usuário revisa invoice em rascunho
2. Confirma emissão
3. Sistema gera PDF, bloqueia edição da versão
4. Status muda para **Emitida**
5. Lançamentos vinculados passam para **Invoiced**

### 7.2 Envio e Pagamento

* Marcar como **Enviada** (manual)
* Marcar como **Paga** (manual)

### 7.3 Correção após emissão (versionamento)

**Regra forte**

> Nunca se reabre invoice emitida; correções geram nova versão.

**Fluxo**

1. Iniciar correção a partir de uma invoice emitida
2. Criar nova versão em **Rascunho** (ex: #58 v2)
3. Ajustar itens/lançamentos na nova versão
4. Emitir a nova versão
5. Versão anterior vira **Substituída**

---

## 8) GST — Validações Legais e Fiscais

### 8.1 Aplicação opcional

O GST é **opcional e configurável pelo usuário**.

**Configurações**

* Flag: aplicar GST
* Percentual configurável (ex: 10%)

**Regras**

* Só calcula GST quando a flag estiver ativa
* Preferência: calcular **por item** e somar para o total
* Total = subtotal + GST
* GST deve aparecer destacado na invoice

---

## 9) Fluxos de Usuário (UX) — Do Lançamento ao Pagamento

### Fluxo A — Lançar horas

1. Criar/editar LançamentoHora
2. Calcular duração e total
3. Status: **Aberto**

### Fluxo B — Seleção manual e geração

1. Filtrar por período
2. Selecionar lançamentos
3. Gerar invoice **Rascunho**
4. Lançamentos viram **Vinculado**

### Fluxo C — Automação assistida

1. Escolher modo (período/local/cliente)
2. Revisar seleção sugerida
3. Criar invoice **Rascunho**

### Fluxo D — Emissão

1. Revisar rascunho
2. Emitir
3. PDF + status **Emitida**
4. Lançamentos viram **Faturado**

### Fluxo E — Envio/Pagamento

1. Marcar **Enviada**
2. Marcar **Paga**

### Fluxo F — Correção/versionamento

1. Criar nova versão
2. Emitir versão nova
3. Versão anterior: **Substituída**

---

## 10) Modelo de Dados (Domínio → Persistência)

> Modelo inicial para PostgreSQL. Ajustável conforme evolução.

### Tabela: pessoas

* id
* nome
* email
* endereco
* valor_hora_padrao_cents (opcional)
* aplica_gst (bool)
* gst_percentual (opcional, inteiro)

### Tabela: clientes

* id
* nome
* abn
* endereco

### Tabela: lancamentos_hora

* id
* pessoa_id
* cliente_id (obrigatorio)
* data
* hora_inicio (derivado)
* hora_fim (derivado)
* break_min (derivado)
* duracao_min (derivado)
* adicional_dia_cents (opcional)
* valor_total_cents (derivado)
* observacoes
* status_faturamento (draft|linked|invoiced)
* created_at
* updated_at

**Constraint**

* unique(pessoa_id, cliente_id, data)

### Tabela: lancamentos_itens

* id
* lancamento_id
* endereco
* start_at
* end_at
* break_min
* duracao_min (derivado)
* valor_hora_cents
* adicional_item_cents (opcional)
* observacoes (opcional)
* created_at
* updated_at

### Tabela: invoices

* id
* numero
* versao
* pessoa_id
* cliente_id
* periodo_inicio
* periodo_fim
* status (draft|issued|sent|paid|superseded)
* subtotal_cents
* gst_total_cents
* total_cents
* invoice_anterior_id (opcional)
* created_at
* issued_at (opcional)
* paid_at (opcional)
* updated_at

**Constraint**

* unique(numero, versao)

### Tabela: invoice_itens

* id
* invoice_id
* descricao
* endereco
* valor_cents
* ordem (opcional)

### Tabela: invoice_lancamentos (relação explícita)

> recomendada para rastreabilidade e flexibilidade

* invoice_id
* lancamento_id

**Constraint**

* unique(lancamento_id)

---

## 11) Invariantes de Consistência (Resumo)

* Uma invoice contém lançamentos de **um único cliente**
* Invoice emitida não é alterada; novas versões substituem
* Um lançamento só pode estar em **uma invoice**
* Lançamento invoiced não pode ser editado financeiramente
* Se um lançamento tiver múltiplos locais, soma dos itens = duração total

---

## 12) Próximos Artefatos do Planejamento

* Wireframe textual das telas
* Lista de endpoints (API) por caso de uso
* Regras financeiras finas (arredondamento, mínimos, etc.)

---

## 13) Observações

Este documento é vivo e deve ser atualizado conforme:

* novas regras surgirem
* casos de uso evoluírem
* necessidades fiscais/formatos de invoice mudarem
