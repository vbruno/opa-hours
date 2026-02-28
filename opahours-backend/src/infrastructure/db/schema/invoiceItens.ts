import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { invoices } from "./invoices.js";

export const invoiceItens = pgTable(
  "invoice_itens",
  {
    id: uuid("id").primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    descricao: text("descricao").notNull(),
    endereco: text("endereco"),
    valorCents: integer("valor_cents").notNull(),
    ordem: integer("ordem").notNull().default(0),
  },
  (table) => [
    index("invoice_itens_invoice_id_idx").on(table.invoiceId),
    check(
      "invoice_itens_descricao_min_len_check",
      sql`char_length(trim(${table.descricao})) >= 2`,
    ),
    check(
      "invoice_itens_valor_cents_non_negative_check",
      sql`${table.valorCents} >= 0`,
    ),
    check("invoice_itens_ordem_non_negative_check", sql`${table.ordem} >= 0`),
  ],
);

export type InvoiceItemRow = typeof invoiceItens.$inferSelect;
export type NewInvoiceItemRow = typeof invoiceItens.$inferInsert;
