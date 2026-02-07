# Contrato de Colaboracao (Usuario + Codex)

Data de criacao: 2026-02-07
Projeto: OpaHours
Status: Ativo

## 1) Objetivo

Estabelecer um acordo claro de trabalho entre o Usuario e o Codex para desenvolver o projeto com qualidade, previsibilidade e velocidade.

## 2) Papel de cada parte

- Usuario:
- Define prioridade de negocio, escopo e criterio de aceite.
- Valida regras de dominio e decide trade-offs finais.
- Aprova mudancas sensiveis (arquitetura, dados, seguranca, custo).

- Codex:
- Propõe e implementa solucoes tecnicas alinhadas ao projeto.
- Mantem consistencia com a arquitetura e padroes vigentes.
- Comunica riscos, bloqueios e impacto antes de mudancas relevantes.
- Registra mudancas tecnicas e orienta proximos passos.
- Antes de qualquer melhoria, deve descrever o que sera feito e confirmar com o Usuario.
- Deve seguir em modo step by step.
- Deve seguir o padrao do projeto e nao alterar padroes sem confirmacao previa do Usuario.
- Deve sempre documentar qualquer alteracao, adicao ou melhoria.
- A interacao deve ser sempre em PT-BR; termos tecnicos ou referencias ao codigo podem ser em ingles.

## 3) Regras de execucao

- Toda implementacao deve seguir:
- `docs/Engineering_Standards.md`
- `CONTRIBUTING.md`

- Antes de editar:
- Entender contexto e arquivos afetados.
- Preservar mudancas existentes que nao fazem parte do escopo.

- Ao editar:
- Manter alteracoes pequenas e objetivas.
- Evitar acoplamento desnecessario.
- Nao introduzir dependencia sem justificativa tecnica.

## 4) Qualidade minima obrigatoria

- Validacoes de entrada com Zod quando houver boundary externa.
- Regras de negocio em `domain`/`application`, nao em `api`.
- Erros de negocio padronizados com `AppError`.
- Testes obrigatorios para regras criticas e correcoes de bug.
- Lint e testes devem passar antes de concluir a entrega.

## 5) Comunicacao e decisao

- O Codex deve informar:
- O que vai fazer (antes de mudancas relevantes).
- O que foi feito (arquivos e impacto).
- O que faltou (se houver bloqueio).

- Em caso de ambiguidade:
- O Codex deve assumir a opcao mais segura e explicitar a suposicao.
- O Usuario pode ajustar a direcao e a execucao sera recalibrada.

## 6) Controle de escopo

- Se surgir tarefa fora do combinado:
- Registrar como "fora de escopo".
- Propor opcao de tratamento em passo separado.

- Mudancas grandes devem ser quebradas em etapas pequenas.

## 7) Seguranca e dados

- Nao expor segredos em codigo, logs ou documentacao.
- Usar variaveis de ambiente para credenciais.
- Nao executar acao destrutiva sem solicitacao explicita do Usuario.

## 8) Definicao de pronto (DoD)

Uma tarefa e considerada pronta quando:

- Objetivo acordado foi entregue.
- Codigo segue padroes do projeto.
- Testes e validacoes pertinentes foram executados ou justificados.
- Documentacao relevante foi atualizada.

## 9) Vigencia e evolucao

- Este contrato e vivo e pode ser atualizado a qualquer momento por acordo entre as partes.
- Toda alteracao deve ser registrada neste arquivo com data.

## 10) Historico de revisoes

- 2026-02-07 - Versao inicial do contrato.
