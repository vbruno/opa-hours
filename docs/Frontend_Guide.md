🎨 Frontend Guide — OpaHours

Documento vivo para acompanhamento do frontend do OpaHours.
Foco: fluxo de telas, componentes, estados, integrações com API e checklist de implementação.

⸻

1) Objetivo do Frontend

Entregar uma experiência rápida e segura para:

Lançar horas → consolidar → selecionar → gerar invoice → emitir → acompanhar envio/pagamento → corrigir por versionamento

Princípios:
	•	Interface deve prevenir erros (não permitir selecionar/faturar duplicado)
	•	Mostrar status claramente (Aberto/Vinculado/Faturado; Rascunho/Emitida/Enviada/Paga/Substituída)
	•	Back-end é a fonte da verdade (frontend segue contratos)

⸻

2) Decisões Fechadas (impactam UI)

✅ D1 — Cliente obrigatório
	•	Todo lançamento pertence a um cliente
	•	UI deve ter cliente padrão pré-selecionado

✅ D2 — Adicional (dia e item)
	•	Tela de lançamento deve permitir:
	•	adicional do dia
	•	adicional por item/local

✅ D3 — Invoice com 2 modos de itens
	•	Padrão: consolidar por local
	•	Alternativa: detalhado por lançamento

⸻

3) Mapa de Telas (MVP)

T1 — Dashboard (resumo)
	•	Total horas semana/mês
	•	Total $ semana/mês
	•	Acesso rápido: “Novo lançamento”, “Gerar invoice”

T2 — Lançamentos (lista)
	•	Filtros: período (início/fim), cliente, status
	•	Listagem por dia
	•	Badges por status:
	•	Aberto
	•	Vinculado
	•	Faturado
	•	Checkbox para seleção (apenas Aberto)
	•	Ações em massa:
	•	Gerar Invoice (manual)

T3 — Lançamento (criar/editar)
	•	Data
	•	Cliente (default)
	•	Hora início/fim + break
	•	Itens por local (1..N)
	•	endereço
	•	duração alocada
	•	adicional do item
	•	Adicional do dia
	•	Total calculado (prévia)

Regras de UI:
	•	Se status = Faturado, bloquear edição financeira
	•	Validar soma das durações dos itens = duração total

T4 — Gerar Invoice (assistente)
	•	Modo:
	•	Manual (lançamentos selecionados)
	•	Automático: por período / por local / por cliente
	•	Período configurável (início/fim)
	•	Cliente (quando aplicável)
	•	Opção: itens consolidado por local (padrão) ou detalhado

T5 — Invoice (rascunho)
	•	Revisar dados: cliente, prestador, período
	•	Lista de itens
	•	Totais (subtotal, GST opcional, total)
	•	Ações:
	•	Remover lançamentos
	•	Emitir invoice
	•	Excluir rascunho

T6 — Invoice (emitida)
	•	Visualização read-only
	•	Ações:
	•	Marcar como enviada
	•	Marcar como paga
	•	Baixar PDF
	•	Corrigir (criar nova versão)

T7 — Invoices (lista)
	•	Filtros: período, cliente, status
	•	Acesso rápido ao PDF

T8 — Correção / Versionamento
	•	Iniciar correção de uma invoice emitida
	•	Nova versão abre em rascunho
	•	Ao emitir: anterior vira Substituída

⸻

4) Componentes-Chave
	•	DateRangePicker (período início/fim)
	•	ClientSelect (com cliente padrão)
	•	StatusBadge (lancamento/invoice)
	•	WorkLogTable (listagem + seleção)
	•	WorkLogForm (criar/editar)
	•	WorkLogItemsEditor (itens por local)
	•	InvoiceBuilder (assistente)
	•	InvoicePreview (rascunho)
	•	InvoiceDetails (emitida)
	•	ConfirmDialog (ações críticas)

⸻

5) Estados de UI e Regras

5.1 Status do lançamento
	•	Aberto: editável, selecionável
	•	Vinculado: não selecionável (já em rascunho), edição limitada
	•	Faturado: não selecionável, read-only financeiro

5.2 Status da invoice
	•	Rascunho: editável
	•	Emitida: read-only, pode marcar enviada/paga
	•	Substituída: read-only, apontar para versão nova

⸻

6) Integração com API (contratos)

Auth (modo atual)
	•	POST /auth/login
	•	POST /auth/refresh
	•	POST /auth/logout
	•	GET /auth/me
	•	POST /users
	•	GET /users
	•	GET /users/:id
	•	PUT /users/:id
	•	DELETE /users/:id

Regras de integração de sessão
	•	Refresh token fica em cookie HttpOnly (frontend não lê cookie diretamente)
	•	Access token fica em memória e vai no header Authorization
	•	Requests de auth/refresh/logout devem enviar credentials (cookie)
	•	Em 401 por expiração de access token, tentar refresh e repetir request original
	•	Se refresh falhar, forçar logout local e redirecionar para login

Work Logs
	•	GET /work-logs
	•	POST /work-logs
	•	PUT /work-logs/:id
	•	DELETE /work-logs/:id

Invoices
	•	GET /invoices
	•	GET /invoices/:id
	•	POST /invoices/draft
	•	POST /invoices/draft/auto
	•	POST /invoices/:id/emit
	•	POST /invoices/:id/mark-sent
	•	POST /invoices/:id/mark-paid
	•	POST /invoices/:id/revise
	•	GET /invoices/:id/pdf

⸻

7) Estratégia de Erros e Feedback
	•	Erros de validação: destacar campo e mostrar mensagem curta
	•	Erros de conflito (ex: lançamento já faturado): toast + refresh da lista
	•	Operações críticas: sempre confirmar (emitir invoice, marcar pago)

⸻

8) Checklist de Implementação

Base
	•	Setup do projeto (React)
	•	Rotas
	•	Design system básico

Lançamentos
	•	T2 lista + filtros + seleção
	•	T3 form + itens por local + validações

Invoice
	•	T4 assistente de geração
	•	T5 rascunho (revisão + emitir)
	•	T6 emitida (status + pdf + revisão)
	•	T7 lista de invoices

Versionamento
	•	T8 fluxo de correção

⸻

9) Log de Decisões
	•	(data) decisão X
	•	(data) decisão Y
