# OpaHours

Backend em TypeScript para registro de horas de trabalho e preparação do faturamento de clientes. O projeto organiza regras de domínio, casos de uso, persistência e API em camadas separadas.

## Estado atual

**Em desenvolvimento.** A API já inclui autenticação, gestão de usuários e operações de registros de horas. O domínio de invoices e os cálculos de faturamento estão em construção; ainda não há rotas de invoices registradas na API.

## O que já existe

- Login, renovação e encerramento de sessão com tokens.
- Rotas de usuários e registros de horas.
- Persistência PostgreSQL com Drizzle ORM e migrações versionadas.
- Documentação HTTP em `/docs` e verificação de serviço em `/health`.
- Testes unitários e de integração para regras de domínio e rotas.

## Tecnologias

Node.js, TypeScript, Fastify, PostgreSQL, Drizzle ORM, Zod, Pino e Vitest.

## Executar localmente

Requer Node.js 20+, npm 10+ e PostgreSQL. Os comandos abaixo são executados em `opahours-backend/`:

```bash
cd opahours-backend
npm ci
cp .env.example .env
```

Edite `.env` com as URLs do seu banco e segredos próprios para JWT. Depois:

```bash
npm run db:migrate
npm run dev
```

A API usa a porta definida por `PORT` (3333 no exemplo). Com o servidor em execução, abra `http://localhost:3333/health` ou `http://localhost:3333/docs`.

## Verificação

```bash
npm run lint
npm run build
npm run test
```

`npm run test` executa os testes unitários. Para os testes de integração, configure também `DATABASE_URL_TEST` e execute `npm run test:integration`.

## Organização do repositório

- `opahours-backend/src/domain`: entidades e regras de negócio.
- `opahours-backend/src/application`: casos de uso e contratos.
- `opahours-backend/src/infrastructure`: banco, repositórios e serviços técnicos.
- `opahours-backend/src/api`: rotas e plugins HTTP.
- `opahours-backend/test`: testes unitários e de integração.
- `docs`: arquitetura, domínio e padrões do projeto.

Para mais detalhes, consulte o [guia do backend](docs/Backend_Guide.md), a [arquitetura](docs/Backend_Architectura.md) e o [planejamento de domínio](docs/Domain_Planning.md).

## Autor

[Bruno S Velho](https://github.com/vbruno) · [LinkedIn](https://www.linkedin.com/in/brunovelho/)
