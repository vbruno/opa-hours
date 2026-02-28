import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const pessoas = pgTable(
  "pessoas",
  {
    id: uuid("id").primaryKey(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    endereco: text("endereco"),
    valorHoraPadraoCents: integer("valor_hora_padrao_cents"),
    aplicaGst: boolean("aplica_gst").notNull().default(false),
    gstPercentual: integer("gst_percentual"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "pessoas_nome_min_len_check",
      sql`char_length(trim(${table.nome})) >= 2`,
    ),
    check(
      "pessoas_email_format_check",
      sql`position('@' in ${table.email}) > 1`,
    ),
    check(
      "pessoas_valor_hora_padrao_non_negative_check",
      sql`${table.valorHoraPadraoCents} is null or ${table.valorHoraPadraoCents} >= 0`,
    ),
    check(
      "pessoas_gst_percentual_non_negative_check",
      sql`${table.gstPercentual} is null or ${table.gstPercentual} >= 0`,
    ),
  ],
);

export type PessoaRow = typeof pessoas.$inferSelect;
export type NewPessoaRow = typeof pessoas.$inferInsert;
