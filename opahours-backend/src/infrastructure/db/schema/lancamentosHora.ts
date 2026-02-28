import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientes } from "./clientes.js";
import { pessoas } from "./pessoas.js";

export const lancamentoStatusEnum = pgEnum("lancamento_status", [
  "draft",
  "linked",
  "invoiced",
]);

export const lancamentosHora = pgTable("lancamentos_hora", {
  id: uuid("id").primaryKey(),
  pessoaId: uuid("pessoa_id")
    .notNull()
    .references(() => pessoas.id, { onDelete: "restrict" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  data: date("data").notNull(),
  horaInicio: timestamp("hora_inicio", { mode: "date", withTimezone: true }),
  horaFim: timestamp("hora_fim", { mode: "date", withTimezone: true }),
  breakMin: integer("break_min").notNull().default(0),
  duracaoMin: integer("duracao_min").notNull().default(0),
  adicionalDiaCents: integer("adicional_dia_cents").notNull().default(0),
  valorTotalCents: integer("valor_total_cents").notNull().default(0),
  observacoes: text("observacoes"),
  statusFaturamento: lancamentoStatusEnum("status_faturamento")
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("lancamentos_hora_pessoa_cliente_data_unique").on(
    table.pessoaId,
    table.clienteId,
    table.data,
  ),
  check("lancamentos_hora_break_min_non_negative_check", sql`${table.breakMin} >= 0`),
  check("lancamentos_hora_duracao_min_non_negative_check", sql`${table.duracaoMin} >= 0`),
  check(
    "lancamentos_hora_hora_range_check",
    sql`(${table.horaInicio} is null and ${table.horaFim} is null) or (${table.horaInicio} is not null and ${table.horaFim} is not null and ${table.horaInicio} <= ${table.horaFim})`,
  ),
]);

export type LancamentoHoraRow = typeof lancamentosHora.$inferSelect;
export type NewLancamentoHoraRow = typeof lancamentosHora.$inferInsert;
