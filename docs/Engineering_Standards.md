# Engenharia de Software - Padroes do Projeto (v1)

Este documento define as regras oficiais de desenvolvimento do OpaHours.
Objetivo: manter consistencia tecnica, reduzir retrabalho e facilitar escala.

## 1) Principios

- Backend e a fonte da verdade para regras de negocio.
- Regras de dominio devem viver em `domain`/`application`, nao em `api`.
- Toda mudanca deve priorizar legibilidade, testabilidade e rastreabilidade.
- Evitar "atalhos de MVP" que criem acoplamento estrutural.

## 2) Arquitetura e organizacao

- Seguir o padrao definido: `domain` -> `application` -> `infrastructure` -> `api`.
- `domain` nao pode depender de Fastify, DB ou detalhes de framework.
- `application` depende de interfaces (ports), nao de implementacoes concretas.
- `infrastructure` implementa ports e integra com DB/servicos externos.
- `api` apenas traduz HTTP <-> caso de uso (sem regra de negocio relevante).
- Organizar por modulo de negocio: `work-logs`, `invoices`, `clients`, `shared`.
- Auth e users devem seguir modo single-user (sem members e sem roles).

## 3) Convencoes de codigo (TypeScript)

- `strict` sempre habilitado.
- Preferir `type` imports quando aplicavel.
- Nao usar `any`; quando inevitavel, justificar em comentario curto.
- Evitar funcoes grandes: extrair funcoes puras para regras e calculos.
- Tratar datas/horas de forma explicita (sem comportamento implicito de timezone).
- Arredondamento monetario sempre centralizado em funcoes de dominio.

## 4) Validacao e erros

- Entrada externa (HTTP/env) sempre validada com Zod.
- Erros de negocio devem usar `AppError` com `code` estavel.
- Erros internos inesperados nao devem vazar detalhes sensiveis para cliente.
- Definir mapeamento padrao de erro para resposta HTTP.
- Mensagens de erro devem ser centralizadas em catalogo unico (evitar string solta em servico/rota).
- `code` deve ser estavel e orientado a contrato de frontend; `message` deve ser texto limpo para exibicao/log, sem parser de codigo.
- Para modulos de dominio (ex: `work-logs`), centralizar no proprio modulo:
- catalogo de mensagens por `code`
- tipo de erro de dominio
- mapeamento `code -> status HTTP`
- O `error-handler` global apenas aplica o padrao de resposta (`code`, `message`, `details`, `requestId`) e usa o mapeamento central.

## 5) Banco de dados e transacoes

- Toda mudanca de schema via migracao (nunca alteracao manual em producao).
- Operacoes criticas devem ser transacionais (UnitOfWork). Casos minimos:
- `Gerar draft de invoice`
- `Emitir invoice`
- `Revisao/versionamento de invoice`
- Regras de invariantes devem existir em 2 niveis:
- `Dominio/aplicacao` (validacao de regra)
- `Banco` (constraints e indices)

## 6) API

- Contratos estaveis e versionados quando houver quebra.
- Nomes de rotas e payloads consistentes com o dominio.
- Endpoints devem retornar erros estruturados (`code`, `message`, `details`).
- Incluir `requestId` no payload de erro para correlacao com logs.
- `GET /health` obrigatorio e simples (sem regra de negocio).
- Swagger/OpenAPI deve acompanhar o estado real da API.
- Toda alteracao de rota (path, params, body, response, codigos HTTP) deve atualizar Swagger/OpenAPI no mesmo escopo.
- Nenhuma tarefa de API e considerada concluida sem validacao manual de `GET /docs`.
- Toda rota deve ser classificada em `config.access` como `public` ou `private`.
- Rotas `private` devem usar `app.authenticate` no preHandler.

## 7) Testes

- Cobertura minima por tipo:
- Regras de dominio: testes unitarios obrigatorios.
- Casos de uso com transacao: testes de integracao obrigatorios.
- Todo bug corrigido deve ganhar teste de regressao.
- Testes devem ser deterministas (sem dependencia de horario atual sem controle).
- Toda implementacao ou ajuste deve ser validado localmente antes de marcar etapa como concluida.
- Fluxo minimo de validacao: `npm run lint`, `npm run test` e, quando aplicavel, `npm run db:check`.

## 8) Observabilidade e operacao

- Logging estruturado com Pino.
- Nunca logar segredo, token, senha ou dado sensivel.
- Cada request deve ter contexto minimo de rastreio (ex: requestId).
- Erros criticos devem ser facilmente filtraveis por `code`.

## 9) Seguranca e configuracao

- Segredos apenas em variaveis de ambiente.
- `.env` local nunca versionado; manter `.env.example` atualizado.
- CORS restritivo fora de desenvolvimento.
- Dependencias devem ser revisadas periodicamente.
- Refresh token deve trafegar em cookie HttpOnly.
- Access token deve trafegar como Bearer token no header `Authorization`.

## 10) Fluxo de trabalho (Git)

- Branches curtas por escopo.
- Commits pequenos e atomicos.
- PRs devem incluir:
- objetivo da mudanca
- riscos
- como testar
- checklist de regressao
- Nao misturar refactor amplo com feature sem necessidade.

## 11) Definicao de pronto (DoD)

Uma entrega so e considerada pronta quando:

- Regras de negocio estao na camada correta.
- Validacoes e erros seguem padrao definido.
- Testes relevantes foram adicionados/atualizados.
- Lint e testes passam localmente.
- Validacao tecnica da mudanca foi executada e registrada no log de alteracoes.
- Documentacao de contrato/regra foi atualizada (quando aplicavel).

## 12) Evolucao deste documento

- Este arquivo e vivo.
- Toda regra nova deve ser registrada aqui com data e justificativa no PR.
