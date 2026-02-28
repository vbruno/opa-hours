import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  abn: text("abn"),
  endereco: text("endereco"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  check("clientes_nome_min_len_check", sql`char_length(trim(${table.nome})) >= 2`),
]);

export type ClienteRow = typeof clientes.$inferSelect;
export type NewClienteRow = typeof clientes.$inferInsert;
