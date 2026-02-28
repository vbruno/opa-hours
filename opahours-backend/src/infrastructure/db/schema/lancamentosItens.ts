import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { lancamentosHora } from "./lancamentosHora.js";

export const lancamentosItens = pgTable("lancamentos_itens", {
  id: uuid("id").primaryKey(),
  lancamentoId: uuid("lancamento_id")
    .notNull()
    .references(() => lancamentosHora.id, { onDelete: "cascade" }),
  endereco: text("endereco").notNull(),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { mode: "date", withTimezone: true }).notNull(),
  breakMin: integer("break_min").notNull().default(0),
  duracaoMin: integer("duracao_min").notNull(),
  valorHoraCents: integer("valor_hora_cents").notNull(),
  adicionalItemCents: integer("adicional_item_cents").notNull().default(0),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  index("lancamentos_itens_lancamento_id_idx").on(table.lancamentoId),
  check("lancamentos_itens_endereco_min_len_check", sql`char_length(trim(${table.endereco})) >= 2`),
  check("lancamentos_itens_break_min_non_negative_check", sql`${table.breakMin} >= 0`),
  check("lancamentos_itens_duracao_min_non_negative_check", sql`${table.duracaoMin} >= 0`),
  check("lancamentos_itens_valor_hora_positive_check", sql`${table.valorHoraCents} > 0`),
  check("lancamentos_itens_period_check", sql`${table.startAt} <= ${table.endAt}`),
]);

export type LancamentoItemRow = typeof lancamentosItens.$inferSelect;
export type NewLancamentoItemRow = typeof lancamentosItens.$inferInsert;
