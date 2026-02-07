# OpaHours

Sistema para controle de horas trabalhadas e faturamento por invoices, com foco em consistencia de regras de negocio e rastreabilidade financeira.

## Status do Projeto

Projeto em fase inicial (esqueleto de arquitetura e padroes definidos).

## Objetivo

Garantir consistencia entre o ciclo completo:

- Horas registradas
- Lancamentos diarios
- Invoice em rascunho
- Invoice emitida
- Pagamento

## Arquitetura

O projeto segue **Clean Architecture + DDD light**, com separacao por camadas e modulos de negocio:

- `domain`: entidades, value objects e regras de negocio
- `application`: casos de uso e ports (interfaces)
- `infrastructure`: implementacoes tecnicas (DB, logger, integracoes)
- `api`: delivery HTTP, rotas e validacoes de entrada

## Estrutura do Repositorio

- `opahours-backend/`: workspace principal com scripts de execucao, lint, testes e build
- `docs/`: arquitetura, dominio, stack e padroes de engenharia
- `notes/`: anotacoes internas do projeto

## Stack Tecnica

- Node.js (LTS)
- TypeScript
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- Pino
- Vitest
- ESLint + Prettier

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL disponivel localmente

## Setup Local

1. Entre no workspace do backend:

```bash
cd opahours-backend
```

2. Instale dependencias:

```bash
npm install
```

3. Configure variaveis de ambiente conforme `.env.example` (quando o arquivo estiver disponivel neste workspace).

## Comandos de Desenvolvimento

Executar em `opahours-backend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:cov
npm run db:generate
npm run db:migrate
```

## Qualidade e Padroes

- Regras oficiais: `docs/Engineering_Standards.md`
- Contrato de colaboracao: `docs/Collaboration_Contract.md`

## Documentacao

- `docs/Backend_Guide.md`
- `docs/Backend_Architectura.md`
- `docs/Backend_Stack.md`
- `docs/Domain_Planning.md`
- `docs/Frontend_Guide.md`

## Roadmap Inicial

- Implementar conexao com DB e schemas Drizzle
- Subir API base com `GET /health`
- Implementar primeiros casos de uso de `work-logs`
- Cobrir regras criticas com testes unitarios e de integracao

## Autor

**Bruno S Velho**
- Email: bruno.velho@gmail.com
- GitHub: https://github.com/vbruno
- LinkedIn: https://www.linkedin.com/in/brunovelho/