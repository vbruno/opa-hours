CREATE TYPE "public"."lancamento_status" AS ENUM('draft', 'linked', 'invoiced');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"abn" text,
	"endereco" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_nome_min_len_check" CHECK (char_length(trim("clientes"."nome")) >= 2)
);
--> statement-breakpoint
CREATE TABLE "lancamentos_hora" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"data" date NOT NULL,
	"hora_inicio" timestamp with time zone,
	"hora_fim" timestamp with time zone,
	"break_min" integer DEFAULT 0 NOT NULL,
	"duracao_min" integer DEFAULT 0 NOT NULL,
	"adicional_dia_cents" integer DEFAULT 0 NOT NULL,
	"valor_total_cents" integer DEFAULT 0 NOT NULL,
	"observacoes" text,
	"status_faturamento" "lancamento_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lancamentos_hora_break_min_non_negative_check" CHECK ("lancamentos_hora"."break_min" >= 0),
	CONSTRAINT "lancamentos_hora_duracao_min_non_negative_check" CHECK ("lancamentos_hora"."duracao_min" >= 0),
	CONSTRAINT "lancamentos_hora_hora_range_check" CHECK (("lancamentos_hora"."hora_inicio" is null and "lancamentos_hora"."hora_fim" is null) or ("lancamentos_hora"."hora_inicio" is not null and "lancamentos_hora"."hora_fim" is not null and "lancamentos_hora"."hora_inicio" <= "lancamentos_hora"."hora_fim"))
);
--> statement-breakpoint
CREATE TABLE "lancamentos_itens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lancamento_id" uuid NOT NULL,
	"endereco" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"break_min" integer DEFAULT 0 NOT NULL,
	"duracao_min" integer NOT NULL,
	"valor_hora_cents" integer NOT NULL,
	"adicional_item_cents" integer DEFAULT 0 NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lancamentos_itens_endereco_min_len_check" CHECK (char_length(trim("lancamentos_itens"."endereco")) >= 2),
	CONSTRAINT "lancamentos_itens_break_min_non_negative_check" CHECK ("lancamentos_itens"."break_min" >= 0),
	CONSTRAINT "lancamentos_itens_duracao_min_non_negative_check" CHECK ("lancamentos_itens"."duracao_min" >= 0),
	CONSTRAINT "lancamentos_itens_valor_hora_positive_check" CHECK ("lancamentos_itens"."valor_hora_cents" > 0),
	CONSTRAINT "lancamentos_itens_period_check" CHECK ("lancamentos_itens"."start_at" <= "lancamentos_itens"."end_at")
);
--> statement-breakpoint
CREATE TABLE "pessoas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"endereco" text,
	"valor_hora_padrao_cents" integer,
	"aplica_gst" boolean DEFAULT false NOT NULL,
	"gst_percentual" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pessoas_nome_min_len_check" CHECK (char_length(trim("pessoas"."nome")) >= 2),
	CONSTRAINT "pessoas_email_format_check" CHECK (position('@' in "pessoas"."email") > 1),
	CONSTRAINT "pessoas_valor_hora_padrao_non_negative_check" CHECK ("pessoas"."valor_hora_padrao_cents" is null or "pessoas"."valor_hora_padrao_cents" >= 0),
	CONSTRAINT "pessoas_gst_percentual_non_negative_check" CHECK ("pessoas"."gst_percentual" is null or "pessoas"."gst_percentual" >= 0)
);
--> statement-breakpoint
ALTER TABLE "lancamentos_hora" ADD CONSTRAINT "lancamentos_hora_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."pessoas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos_hora" ADD CONSTRAINT "lancamentos_hora_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos_itens" ADD CONSTRAINT "lancamentos_itens_lancamento_id_lancamentos_hora_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos_hora"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lancamentos_hora_pessoa_cliente_data_unique" ON "lancamentos_hora" USING btree ("pessoa_id","cliente_id","data");--> statement-breakpoint
CREATE INDEX "lancamentos_itens_lancamento_id_idx" ON "lancamentos_itens" USING btree ("lancamento_id");
