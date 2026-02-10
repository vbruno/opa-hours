# OpaHours

Backend em TypeScript para controle de horas e faturamento por invoice.

Status atual: projeto em fase inicial com esqueleto de arquitetura e regras base de engenharia ja definidas.

## Objetivo

Garantir consistencia entre:

- Horas trabalhadas
- Lancamentos
- Invoice em rascunho
- Invoice emitida
- Pagamento

## Stack

- Node.js (LTS)
- TypeScript
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- Pino
- Vitest
- ESLint + Prettier

## Arquitetura

O projeto segue Clean Architecture + DDD light, organizado em camadas:

- `src/domain`: entidades, value objects, regras de negocio
- `src/application`: casos de uso e ports (interfaces)
- `src/infrastructure`: DB, repositorios, logger e integracoes externas
- `src/api`: rotas/controladores HTTP e validacao de entrada

## Estrutura do repositorio

- `src/`: codigo-fonte principal
- `test/`: testes unitarios e de integracao
- `docs/`: guia de dominio, arquitetura e padroes
- `opahours-backend/`: workspace com scripts de execucao/build/test/lint

## Requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado
- PostgreSQL disponivel localmente

## Configuracao local

1. Instale as dependencias:

```bash
cd opahours-backend
npm install
```

2. Configure variaveis de ambiente na raiz do projeto:

```bash
cp .env.example .env
```

3. Ajuste `DATABASE_URL` no `.env` para sua base local.

## Comandos principais

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

## Documentacao oficial

- Guia backend: `docs/Backend_Guide.md`
- Arquitetura backend: `docs/Backend_Architectura.md`
- Stack backend: `docs/Backend_Stack.md`
- Planejamento de dominio: `docs/Domain_Planning.md`
- Guia frontend: `docs/Frontend_Guide.md`
- Padroes de engenharia: `docs/Engineering_Standards.md`
- Contrato de colaboracao: `docs/Collaboration_Contract.md`

## Regras de contribuicao

Antes de abrir PR, siga:

- `docs/Engineering_Standards.md`

## Proximos passos (fase atual)

- Implementar conexao DB e schemas Drizzle
- Subir servidor Fastify com rotas basicas (`/health`)
- Implementar primeiros casos de uso de `work-logs`
- Adicionar testes unitarios de regras de dominio

## Autor

**Bruno S Velho**

- Email: bruno.velho@gmail.com
- GitHub: https://github.com/vbruno
- LinkedIn: https://www.linkedin.com/in/brunovelho/
