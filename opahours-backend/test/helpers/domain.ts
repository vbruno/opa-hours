import { randomUUID } from "node:crypto";

import { db } from "../../src/infrastructure/db/connection.js";
import { clientes } from "../../src/infrastructure/db/schema/clientes.js";
import { pessoas } from "../../src/infrastructure/db/schema/pessoas.js";

export const seedPessoa = async (input?: {
  id?: string;
  nome?: string;
  email?: string;
  endereco?: string | null;
  valorHoraPadraoCents?: number | null;
}): Promise<{ id: string }> => {
  const id = input?.id ?? randomUUID();

  await db.insert(pessoas).values({
    id,
    nome: input?.nome ?? "Pessoa Teste",
    email: input?.email ?? `pessoa-${id}@example.com`,
    endereco: input?.endereco ?? "Rua Teste",
    valorHoraPadraoCents: input?.valorHoraPadraoCents ?? 10000,
  });

  return { id };
};

export const seedCliente = async (input?: {
  id?: string;
  nome?: string;
  abn?: string | null;
  endereco?: string | null;
}): Promise<{ id: string }> => {
  const id = input?.id ?? randomUUID();

  await db.insert(clientes).values({
    id,
    nome: input?.nome ?? "Cliente Teste",
    abn: input?.abn ?? null,
    endereco: input?.endereco ?? "Endereco Cliente",
  });

  return { id };
};
