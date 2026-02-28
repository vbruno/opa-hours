import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { invoices } from "./invoices.js";
import { lancamentosHora } from "./lancamentosHora.js";

export const invoiceLancamentos = pgTable(
  "invoice_lancamentos",
  {
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    lancamentoId: uuid("lancamento_id")
      .notNull()
      .references(() => lancamentosHora.id, { onDelete: "restrict" }),
  },
  (table) => [
    uniqueIndex("invoice_lancamentos_lancamento_unique").on(table.lancamentoId),
    uniqueIndex("invoice_lancamentos_invoice_lancamento_unique").on(
      table.invoiceId,
      table.lancamentoId,
    ),
    index("invoice_lancamentos_invoice_id_idx").on(table.invoiceId),
  ],
);

export type InvoiceLancamentoRow = typeof invoiceLancamentos.$inferSelect;
export type NewInvoiceLancamentoRow = typeof invoiceLancamentos.$inferInsert;
