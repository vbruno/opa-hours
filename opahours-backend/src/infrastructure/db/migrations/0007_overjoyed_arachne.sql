CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'sent', 'paid', 'superseded');--> statement-breakpoint
CREATE TABLE "invoice_itens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoice_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"endereco" text,
	"valor_cents" integer NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_itens_descricao_min_len_check" CHECK (char_length(trim("invoice_itens"."descricao")) >= 2),
	CONSTRAINT "invoice_itens_valor_cents_non_negative_check" CHECK ("invoice_itens"."valor_cents" >= 0),
	CONSTRAINT "invoice_itens_ordem_non_negative_check" CHECK ("invoice_itens"."ordem" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoice_lancamentos" (
	"invoice_id" uuid NOT NULL,
	"lancamento_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"numero" integer NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"periodo_inicio" date NOT NULL,
	"periodo_fim" date NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"gst_total_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"invoice_anterior_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"issued_at" timestamp,
	"paid_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_numero_positive_check" CHECK ("invoices"."numero" > 0),
	CONSTRAINT "invoices_versao_positive_check" CHECK ("invoices"."versao" > 0),
	CONSTRAINT "invoices_period_range_check" CHECK ("invoices"."periodo_inicio" <= "invoices"."periodo_fim"),
	CONSTRAINT "invoices_subtotal_cents_non_negative_check" CHECK ("invoices"."subtotal_cents" >= 0),
	CONSTRAINT "invoices_gst_total_cents_non_negative_check" CHECK ("invoices"."gst_total_cents" >= 0),
	CONSTRAINT "invoices_total_cents_non_negative_check" CHECK ("invoices"."total_cents" >= 0),
	CONSTRAINT "invoices_total_consistency_check" CHECK ("invoices"."total_cents" = "invoices"."subtotal_cents" + "invoices"."gst_total_cents")
);
--> statement-breakpoint
ALTER TABLE "invoice_itens" ADD CONSTRAINT "invoice_itens_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lancamentos" ADD CONSTRAINT "invoice_lancamentos_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lancamentos" ADD CONSTRAINT "invoice_lancamentos_lancamento_id_lancamentos_hora_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos_hora"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."pessoas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_anterior_id_invoices_id_fk" FOREIGN KEY ("invoice_anterior_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_itens_invoice_id_idx" ON "invoice_itens" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_lancamentos_lancamento_unique" ON "invoice_lancamentos" USING btree ("lancamento_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_lancamentos_invoice_lancamento_unique" ON "invoice_lancamentos" USING btree ("invoice_id","lancamento_id");--> statement-breakpoint
CREATE INDEX "invoice_lancamentos_invoice_id_idx" ON "invoice_lancamentos" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_numero_versao_unique" ON "invoices" USING btree ("numero","versao");
