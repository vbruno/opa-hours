import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientes } from "./clientes.js";
import { pessoas } from "./pessoas.js";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "sent",
  "paid",
  "superseded",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey(),
    numero: integer("numero").notNull(),
    versao: integer("versao").notNull().default(1),
    pessoaId: uuid("pessoa_id")
      .notNull()
      .references(() => pessoas.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "restrict" }),
    periodoInicio: date("periodo_inicio").notNull(),
    periodoFim: date("periodo_fim").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    subtotalCents: integer("subtotal_cents").notNull(),
    gstTotalCents: integer("gst_total_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    invoiceAnteriorId: uuid("invoice_anterior_id").references(
      (): AnyPgColumn => invoices.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    issuedAt: timestamp("issued_at", { mode: "date" }),
    paidAt: timestamp("paid_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_numero_versao_unique").on(table.numero, table.versao),
    check("invoices_numero_positive_check", sql`${table.numero} > 0`),
    check("invoices_versao_positive_check", sql`${table.versao} > 0`),
    check(
      "invoices_period_range_check",
      sql`${table.periodoInicio} <= ${table.periodoFim}`,
    ),
    check(
      "invoices_subtotal_cents_non_negative_check",
      sql`${table.subtotalCents} >= 0`,
    ),
    check(
      "invoices_gst_total_cents_non_negative_check",
      sql`${table.gstTotalCents} >= 0`,
    ),
    check(
      "invoices_total_cents_non_negative_check",
      sql`${table.totalCents} >= 0`,
    ),
    check(
      "invoices_total_consistency_check",
      sql`${table.totalCents} = ${table.subtotalCents} + ${table.gstTotalCents}`,
    ),
  ],
);

export type InvoiceRow = typeof invoices.$inferSelect;
export type NewInvoiceRow = typeof invoices.$inferInsert;
